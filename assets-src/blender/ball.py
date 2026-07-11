"""
Procedural realistic basketball for the portfolio-3d scene.

Run headless:
  blender -b -P ball.py -- --render     # writes _preview_ball.png
  blender -b -P ball.py -- --export     # writes ../../public/models/basketball.glb

Seam pattern = real 8-panel ball: two curved meridian seams meeting at two
opposite "eyes" (poles), plus one belt that waves up/down as it circles — matched
to a photo, NOT a straight cross/grid. Pebble grain via a fine noise displace.
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
# Exact classic pattern: ONE horizontal equator + THREE full meridians through
# the poles (0/60/120 deg). From the front that reads as: a straight vertical
# centre line, two concave lines flanking it, one horizontal line — and all six
# half-lines converge at the top/bottom pole point. No waves.
P = Vector((0.0, 1.0, 0.0))  # pole axis straight up
A = Vector((1.0, 0.0, 0.0))
B = Vector((0.0, 0.0, 1.0))

def seam_curve(points, name):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.02
    cu.bevel_resolution = 3
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

def meridian(phi, n=200):
    pts = []
    for i in range(n):
        s = i / n * 2 * math.pi
        d = A * math.cos(phi) + B * math.sin(phi)
        pts.append((P * (math.cos(s) * R)) + (d * (math.sin(s) * R)))
    return pts

def equator(n=200):
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi
        d = A * math.cos(t) + B * math.sin(t)
        pts.append(d * R)
    return pts

seam_curve(meridian(0.0), "seam_m0")
seam_curve(meridian(math.pi / 3), "seam_m1")
seam_curve(meridian(2 * math.pi / 3), "seam_m2")
seam_curve(equator(), "seam_eq")

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
    cam.location = (1.4, -3.6, 0.35); cam_d.lens = 60  # near-frontal, like the reference photo
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
