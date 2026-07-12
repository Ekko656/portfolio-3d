"""
Procedural realistic basketball for the portfolio-3d scene.

Run headless:
  blender -b -P ball.py -- --render     # writes _preview_ball.png
  blender -b -P ball.py -- --export     # writes ../../public/models/basketball.glb

Seam pattern (traced from a photo): a horizontal equator + a vertical centre
line (both great circles, so they read straight) + two side seams that are
OFFSET small circles tilted off the view axis, so each one bows OUTWARD and only
ever crosses the equator — no pole convergence. Pebble grain via noise displace.
"""
import bpy, math, os, sys
from mathutils import Vector

ARGV = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
DO_RENDER = "--render" in ARGV
DO_EXPORT = "--export" in ARGV
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- clean scene -----------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.textures):
    for d in list(blk):
        blk.remove(d)

R = 1.0

# ---- materials -------------------------------------------------------------
def mat(name, rgb, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

leather = mat("leather", (0.51, 0.13, 0.025), 0.62)
seam_mat = mat("seam", (0.03, 0.02, 0.015), 0.9)

# ---- ball body: sphere + subtle pebble displacement ------------------------
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=R)
ball = bpy.context.active_object
ball.name = "basketball"
bpy.ops.object.shade_smooth()
ball.data.materials.append(leather)

ntex = bpy.data.textures.new("pebble", type="CLOUDS")
ntex.noise_scale = 0.03
ntex.noise_depth = 3
disp = ball.modifiers.new("pebble", "DISPLACE")
disp.texture = ntex
disp.strength = 0.014
disp.mid_level = 0.5
bpy.context.view_layer.objects.active = ball
bpy.ops.object.modifier_apply(modifier="pebble")

# ---- seams -----------------------------------------------------------------
P = Vector((0.0, 0.0, 1.0))  # pole axis straight up (Blender Z)
A = Vector((1.0, 0.0, 0.0))
B = Vector((0.0, 1.0, 0.0))

def seam_curve(points, name):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.032  # thick channel like a real moulded seam
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p.x, p.y, p.z, 1)
    sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(seam_mat)
    bpy.context.collection.objects.link(ob)
    return ob

def circle(center, u, v, radius, n=200):
    """Circle on the sphere: center point + two in-plane unit vectors."""
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi
        pts.append(center + u * (radius * math.cos(t)) + v * (radius * math.sin(t)))
    return pts

ZERO = Vector((0, 0, 0))

def side_seam(sign):
    """A smooth CONCAVE side seam: the centre meridian (a great circle, so it is
    perfectly smooth with no cusp) pushed sideways by an offset that is SMALL at
    the equator and LARGE toward the poles, then re-projected onto the sphere.
    Result: closest to the centre line where it crosses the equator, curving
    steadily outward toward the top and bottom — a pronounced bow, no wave, and
    it never reaches a pole or the centre seam. `sign` = +1 right / -1 left."""
    X0 = 0.30 * R          # offset at the equator (the pinch — slightly off-centre)
    XE = 0.64 * R          # offset toward the poles (pronounced splay)
    pts, N = [], 200
    for i in range(N):
        th = 2 * math.pi * i / N
        # centre meridian in the B-P plane (x = 0), front half at th in (0, pi)
        base = P * (R * math.cos(th)) + B * (-R * math.sin(th))
        dx = X0 + (XE - X0) * (math.cos(th) ** 2)   # small at equator, large at poles
        p = (base + A * (sign * dx)).normalized() * R
        pts.append(p)
    return pts

# 1) middle horizontal line — the equator (great circle, reads straight)
seam_curve(circle(ZERO, A, B, R), "seam_eq")
# 2) middle vertical line — great circle in the B-P plane (reads straight,
#    viewed along -B), crossing the equator dead centre
seam_curve(circle(ZERO, B, P, R), "seam_center")
# 3) two concave side seams that pinch in at the equator and splay outward
seam_curve(side_seam(1), "seam_R")
seam_curve(side_seam(-1), "seam_L")

# ---- render / export -------------------------------------------------------
def setup_render():
    scn = bpy.context.scene
    scn.render.resolution_x = scn.render.resolution_y = 640
    scn.render.film_transparent = True
    try:
        scn.render.engine = "CYCLES"
        scn.cycles.samples = 48
    except Exception:
        pass
    cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d)
    bpy.context.collection.objects.link(cam); scn.camera = cam
    cam.location = (0.0, -3.6, 0.0); cam_d.lens = 60  # near-frontal, like the reference photo
    # aim at origin
    dirv = Vector((0, 0, 0)) - Vector(cam.location)
    cam.rotation_euler = dirv.to_track_quat("-Z", "Y").to_euler()
    for loc, e in [((3, -3, 4), 900), ((-3, -2, 2), 300)]:
        ld = bpy.data.lights.new("l", "AREA"); ld.energy = e; ld.size = 5
        lo = bpy.data.objects.new("l", ld); lo.location = loc
        dv = Vector((0, 0, 0)) - Vector(loc); lo.rotation_euler = dv.to_track_quat("-Z", "Y").to_euler()
        bpy.context.collection.objects.link(lo)

if DO_RENDER:
    setup_render()
    bpy.context.scene.render.filepath = os.path.join(HERE, "_preview_ball.png")
    bpy.ops.render.render(write_still=True)
    print("rendered ->", bpy.context.scene.render.filepath)

if DO_EXPORT:
    out = os.path.abspath(os.path.join(HERE, "..", "..", "public", "models", "basketball.glb"))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_yup=False)
    print("exported ->", out)
