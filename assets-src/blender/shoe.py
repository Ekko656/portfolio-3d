"""
Procedural three-stripe sneaker (Samba/Gazelle-type silhouette) for portfolio-3d.

Run headless:
  blender -b -P shoe.py -- --render     # writes _preview_shoe.png
  blender -b -P shoe.py -- --export     # writes ../../public/models/sneaker.glb

The upper is LOFTED from cross-sections and smoothed with subdivision surface (a
real curved shoe form, not stacked boxes); a beveled gum sole, three side stripes
shrink-wrapped to the upper, laces, tongue and a recessed collar complete it.
Heel at -Z, toe at +Z, sole sitting on y=0.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

ARGV = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
DO_RENDER = "--render" in ARGV
DO_EXPORT = "--export" in ARGV
HERE = os.path.dirname(os.path.abspath(__file__))
COLL = bpy.context.collection

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
    for d in list(blk):
        blk.remove(d)

def mat(name, rgb, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

BLUE = mat("suede", (0.055, 0.12, 0.42), 0.72)
WHITE = mat("white", (0.86, 0.83, 0.75), 0.5)
GUM = mat("gum", (0.62, 0.42, 0.2), 0.55)
DARK = mat("dark", (0.02, 0.02, 0.02), 0.8)

# ---- upper: loft cross-sections (z heel->toe), each an ellipse -------------
# Real sneaker silhouette: tall rounded heel (collar), a dip at the ankle
# throat, a rise back over the instep, then taper with a slight toe spring.
# (z, center-y, half-width, half-height)
SECTIONS = [
    (-0.50, 0.21, 0.075, 0.20),   # heel back, tall + rounded
    (-0.42, 0.23, 0.13, 0.225),   # heel/collar peak
    (-0.30, 0.21, 0.16, 0.21),
    (-0.14, 0.17, 0.175, 0.175),  # ankle-throat dip
    (0.04, 0.155, 0.18, 0.16),    # instep
    (0.22, 0.13, 0.172, 0.13),
    (0.36, 0.105, 0.15, 0.10),
    (0.46, 0.09, 0.11, 0.078),    # toe box — centreline lifts (toe spring)
    (0.51, 0.09, 0.055, 0.055),
]
N = 24
bm = bmesh.new()
rings = []
for (z, cy, hw, hh) in SECTIONS:
    ring = []
    for i in range(N):
        a = i / N * 2 * math.pi
        ring.append(bm.verts.new((hw * math.cos(a), cy + hh * math.sin(a), z)))
    rings.append(ring)
for r in range(len(rings) - 1):
    Aa, Bb = rings[r], rings[r + 1]
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((Aa[i], Aa[j], Bb[j], Bb[i]))
bm.faces.new(list(reversed(rings[0])))
bm.faces.new(list(rings[-1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
umesh = bpy.data.meshes.new("upper")
bm.to_mesh(umesh)
bm.free()
upper = bpy.data.objects.new("upper", umesh)
COLL.objects.link(upper)
upper.data.materials.append(BLUE)
sub = upper.modifiers.new("subsurf", "SUBSURF")
sub.levels = sub.render_levels = 2
for p in upper.data.polygons:
    p.use_smooth = True

# ---- gum sole: a beveled rounded slab following the footprint --------------
def rounded_slab(name, length, width, y0, y1, radius, material):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bm.free()
    bm2 = bmesh.new()
    # build a stadium (rounded-rect) footprint extruded between y0 and y1
    hw, hl = width / 2, length / 2
    pts = []
    steps = 8
    corners = [(hw - radius, hl - radius), (-(hw - radius), hl - radius),
               (-(hw - radius), -(hl - radius)), (hw - radius, -(hl - radius))]
    start = [0, math.pi / 2, math.pi, 3 * math.pi / 2]
    for (cx, cz), a0 in zip(corners, start):
        for s in range(steps + 1):
            a = a0 + s / steps * (math.pi / 2)
            pts.append((cx + radius * math.cos(a), cz + radius * math.sin(a)))
    bottom = [bm2.verts.new((x, y0, z)) for (x, z) in pts]
    top = [bm2.verts.new((x, y1, z)) for (x, z) in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm2.faces.new((bottom[i], bottom[j], top[j], top[i]))
    bm2.faces.new(list(reversed(bottom)))
    bm2.faces.new(list(top))
    bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces)
    m = bpy.data.meshes.new(name)
    bm2.to_mesh(m)
    bm2.free()
    ob = bpy.data.objects.new(name, m)
    COLL.objects.link(ob)
    ob.data.materials.append(material)
    bev = ob.modifiers.new("bev", "BEVEL")
    bev.width = 0.02
    bev.segments = 3
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

sole = rounded_slab("sole", length=1.06, width=0.36, y0=0.0, y1=0.055, radius=0.09, material=GUM)
mid = rounded_slab("midsole", length=1.05, width=0.35, y0=0.05, y1=0.085, radius=0.085, material=WHITE)

# ---- three side stripes: slanted bars that protrude through the upper ------
def stripe(sx, z):
    m = bpy.data.meshes.new("stripe")
    bmt = bmesh.new()
    bmesh.ops.create_cube(bmt, size=1.0)
    for v in bmt.verts:
        v.co.x *= 0.06     # protrusion depth (pokes through the surface)
        v.co.y *= 0.26     # height of the bar (slanted)
        v.co.z *= 0.045    # stripe width
    bmesh.ops.bevel(bmt, geom=bmt.verts[:] + bmt.edges[:], offset=0.01, segments=2, affect="EDGES")
    bmt.to_mesh(m)
    bmt.free()
    ob = bpy.data.objects.new("stripe", m)
    COLL.objects.link(ob)
    ob.data.materials.append(WHITE)
    ob.rotation_euler = (math.radians(34), 0, 0)   # slant toward the heel
    ob.location = (sx * 0.152, 0.16, z)            # pokes proud of the side
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

for sx in (-1, 1):
    for z in (0.1, 0.0, -0.1):
        stripe(sx, z)

# ---- collar opening (recessed dark disc) + tongue + laces ------------------
def add(name, prim, loc, rot, scale, material, **kw):
    getattr(bpy.ops.mesh, prim)(location=loc, **kw)
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler = rot
    ob.scale = scale
    ob.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return ob

# ankle opening: dark ellipse sunk into the collar top, with a padded rim
add("opening", "primitive_cylinder_add", (0, 0.385, -0.28), (math.radians(98), 0, 0),
    (0.08, 0.125, 0.03), DARK, vertices=28, radius=1, depth=1)
rim = add("rim", "primitive_torus_add", (0, 0.398, -0.28), (math.radians(98), 0, 0),
          (1, 1, 1), BLUE, major_radius=0.098, minor_radius=0.02)
rim.scale = (0.9, 1.28, 1)
# heel pull tab, hugging the back of the collar
add("tab", "primitive_cube_add", (0, 0.385, -0.445), (math.radians(-30), 0, 0),
    (0.028, 0.032, 0.009), WHITE, size=1)
# tongue poking up out of the throat
add("tongue", "primitive_cube_add", (0, 0.35, -0.1), (math.radians(30), 0, 0),
    (0.08, 0.025, 0.1), BLUE, size=1)
add("tongue_tip", "primitive_cylinder_add", (0, 0.383, -0.135), (0, math.radians(90), 0),
    (0.024, 0.024, 0.08), BLUE, vertices=16, radius=1, depth=1)
# laces: bars crossing the throat, following the instep slope (above the surface)
LACES = [(0.288, 0.145), (0.307, 0.075), (0.326, 0.005), (0.344, -0.065)]
for i, (y, z) in enumerate(LACES):
    add(f"lace{i}", "primitive_cylinder_add", (0, y, z), (0, math.radians(90), math.radians(6 if i % 2 else -6)),
        (0.011, 0.011, 0.15), WHITE, vertices=12, radius=1, depth=1)

# ---- render / export -------------------------------------------------------
from mathutils import Matrix

def look_at(cam, loc, target):
    fwd = (Vector(target) - Vector(loc)).normalized()
    right = fwd.cross(Vector((0, 1, 0)))
    if right.length < 1e-4:
        right = Vector((1, 0, 0))
    right.normalize()
    up = right.cross(fwd)
    M = Matrix.Identity(4)
    M.col[0][:3] = right
    M.col[1][:3] = up
    M.col[2][:3] = -fwd
    M.translation = Vector(loc)
    cam.matrix_world = M

def setup_render(cam_loc):
    scn = bpy.context.scene
    scn.render.resolution_x = scn.render.resolution_y = 700
    scn.render.film_transparent = True
    try:
        scn.render.engine = "CYCLES"
        scn.cycles.samples = 48
    except Exception:
        pass
    cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d)
    COLL.objects.link(cam); scn.camera = cam
    cam_d.lens = 50
    look_at(cam, cam_loc, (0, 0.13, 0))
    for loc, e in [((2.5, 2.5, 3.5), 1200), ((-2.5, 1.5, 1.5), 400)]:
        ld = bpy.data.lights.new("l", "AREA"); ld.energy = e; ld.size = 6
        lo = bpy.data.objects.new("l", ld); lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        COLL.objects.link(lo)

if DO_RENDER:
    setup_render((2.6, 2.2, 2.4))
    bpy.context.scene.render.filepath = os.path.join(HERE, "_preview_shoe.png")
    bpy.ops.render.render(write_still=True)
    print("rendered ->", bpy.context.scene.render.filepath)

if DO_EXPORT:
    # apply modifiers so the GLB carries the smooth geometry
    for ob in list(COLL.objects):
        if ob.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = ob
        for mo in list(ob.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mo.name)
            except Exception as e:
                print("skip mod", mo.name, e)
    # join everything into one object
    meshes = [o for o in COLL.objects if o.type == "MESH"]
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = "sneaker"
    out = os.path.abspath(os.path.join(HERE, "..", "..", "public", "models", "sneaker.glb"))
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_yup=False)
    print("exported ->", out)
