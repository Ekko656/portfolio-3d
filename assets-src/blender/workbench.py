"""
High-detail T-slot aluminium extrusion workbench for the portfolio scene.

Builds one master T-slot beam (square tube with a slot channel cut into each
face + a centre bore), bevels it, then instances it into a full frame: 4 legs,
top + bottom rectangles, cross-braces. Adds corner gusset brackets with bolts,
a thick dark work-surface, levelling feet, and a slatted lower shelf.

Run:  blender --background --python assets-src/blender/workbench.py -- [--render|--export]
Preview render -> assets-src/blender/_preview_workbench.png
Export         -> public/models/workbench.glb
"""

import bpy, bmesh, sys, math, os
from mathutils import Vector

# ---------------------------------------------------------------- housekeeping
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def add_cube(name, size, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    return o

def boolean(target, cutter, op='DIFFERENCE'):
    m = target.modifiers.new('bool', 'BOOLEAN')
    m.operation = op
    m.solver = 'FLOAT'
    m.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

# ---------------------------------------------------------------- materials
def mat(name, color, metallic=1.0, rough=0.4, emit=None, emit_str=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if emit:
        bsdf.inputs['Emission Color'].default_value = (*emit, 1)
        bsdf.inputs['Emission Strength'].default_value = emit_str
    return m

ALU = None
STEEL = None
TOP = None

# ---------------------------------------------------------------- t-slot beam
# Cross-section side = S (in the local Y/Z plane); beam runs along local X.
S = 0.12
SLOT_W = 0.045     # open slot width on each face
SLOT_D = 0.03      # slot depth
BORE_R = 0.018     # centre bore radius

def make_master_beam():
    beam = add_cube('beam', (2.0, S, S))  # 2u long, scaled per member later
    # centre bore along X
    bpy.ops.mesh.primitive_cylinder_add(radius=BORE_R, depth=2.4, location=(0, 0, 0))
    bore = bpy.context.active_object
    bore.rotation_euler[1] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)
    boolean(beam, bore)
    # four face slots (thin long boxes just under each face)
    half = S / 2
    faces = [
        (0,  half - SLOT_D / 2, 0, (2.4, SLOT_W, SLOT_D)),  # +Y face
        (0, -half + SLOT_D / 2, 0, (2.4, SLOT_W, SLOT_D)),  # -Y face
        (0, 0,  half - SLOT_D / 2, (2.4, SLOT_D, SLOT_W)),  # +Z face
        (0, 0, -half + SLOT_D / 2, (2.4, SLOT_D, SLOT_W)),  # -Z face
    ]
    for x, y, z, sz in faces:
        c = add_cube('slotcut', sz, (x, y, z))
        boolean(beam, c)
    # bevel all edges for the anodized-extrusion read
    bev = beam.modifiers.new('bevel', 'BEVEL')
    bev.width = 0.006
    bev.segments = 3
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(30)
    bpy.context.view_layer.objects.active = beam
    bpy.ops.object.modifier_apply(modifier='bevel')
    beam.data.materials.append(ALU)
    return beam

def place_beam(master, length, loc, axis):
    """Duplicate the master, scale to `length` along its local X, orient to axis."""
    o = master.copy()
    o.data = master.data.copy()
    bpy.context.collection.objects.link(o)
    o.scale = (length / 2.0, 1, 1)   # master is 2u long
    if axis == 'X':
        o.rotation_euler = (0, 0, 0)
    elif axis == 'Y':
        o.rotation_euler = (0, 0, math.radians(90))
    elif axis == 'Z':
        o.rotation_euler = (0, math.radians(90), 0)
    o.location = loc
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    return o

# ---------------------------------------------------------------- brackets/bolts
def bolt(loc, r=0.016, h=0.02, axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=6, location=loc)
    o = bpy.context.active_object
    if axis == 'Y':
        o.rotation_euler[0] = math.radians(90)
    if axis == 'X':
        o.rotation_euler[1] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(STEEL)
    return o

def corner_bracket(loc):
    """L-gusset made of two thin plates + 4 bolts."""
    parts = []
    p1 = add_cube('br', (0.14, 0.14, 0.012), (loc[0], loc[1], loc[2]))
    p2 = add_cube('br', (0.14, 0.012, 0.14), (loc[0], loc[1], loc[2]))
    for p in (p1, p2):
        bev = p.modifiers.new('b', 'BEVEL'); bev.width = 0.004; bev.segments = 2
        bpy.context.view_layer.objects.active = p; bpy.ops.object.modifier_apply(modifier='b')
        p.data.materials.append(STEEL)
        parts.append(p)
    return parts

# ---------------------------------------------------------------- build frame
def build():
    global ALU, STEEL, TOP
    ALU = mat('Alu', (0.62, 0.64, 0.66), metallic=1.0, rough=0.34)
    STEEL = mat('Steel', (0.11, 0.12, 0.13), metallic=1.0, rough=0.45)
    TOP = mat('Top', (0.05, 0.045, 0.04), metallic=0.2, rough=0.7)

    master = make_master_beam()
    master.hide_render = True  # keep as template only

    W, D, H = 3.0, 1.5, 1.35   # outer frame dims (Blender units)
    hx, hz, top = W / 2, D / 2, H
    objs = []
    # 4 legs (vertical, along Z-up world -> use Blender Z as up)
    for sx in (-hx, hx):
        for sz in (-hz, hz):
            objs.append(place_beam(master, H, (sx, sz, H / 2), 'Z'))
    # top rectangle (along X and Y)
    for sz in (-hz, hz):
        objs.append(place_beam(master, W, (0, sz, top), 'X'))
    for sx in (-hx, hx):
        objs.append(place_beam(master, D, (sx, 0, top), 'Y'))
    # bottom rectangle (raised a little for the shelf)
    bz = 0.25
    for sz in (-hz, hz):
        objs.append(place_beam(master, W, (0, sz, bz), 'X'))
    for sx in (-hx, hx):
        objs.append(place_beam(master, D, (sx, 0, bz), 'Y'))
    # a mid cross-brace under the top for heft
    objs.append(place_beam(master, W, (0, 0, top - 0.02), 'X'))

    # corner brackets + bolts at the top corners
    for sx in (-hx, hx):
        for sz in (-hz, hz):
            corner_bracket((sx - math.copysign(0.09, sx), sz - math.copysign(0.09, sz), top - 0.09))

    # bolt heads dotted along the top rails
    for x in [i * 0.5 - 1.0 for i in range(5)]:
        for sz in (-hz, hz):
            bolt((x, sz, top + S / 2), axis='Z')

    # thick work-surface sitting on the top frame
    surf = add_cube('surface', (W + 0.16, D + 0.16, 0.09), (0, 0, top + S / 2 + 0.045))
    bev = surf.modifiers.new('b', 'BEVEL'); bev.width = 0.012; bev.segments = 3
    bpy.context.view_layer.objects.active = surf; bpy.ops.object.modifier_apply(modifier='b')
    surf.data.materials.append(TOP)

    # levelling feet (threaded stud + pad)
    for sx in (-hx, hx):
        for sz in (-hz, hz):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.05, location=(sx, sz, 0.0))
            foot = bpy.context.active_object; foot.data.materials.append(STEEL)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.02, location=(sx, sz, -0.03))
            pad = bpy.context.active_object
            pad.data.materials.append(mat('Rubber', (0.02, 0.02, 0.02), 0.0, 0.9))

    # slatted lower shelf
    for i in range(9):
        y = -hz + 0.12 + i * (D - 0.24) / 8
        s = add_cube('slat', (W - 0.2, 0.11, 0.03), (0, y, bz + S / 2))
        bev = s.modifiers.new('b', 'BEVEL'); bev.width = 0.004; bev.segments = 2
        bpy.context.view_layer.objects.active = s; bpy.ops.object.modifier_apply(modifier='b')
        s.data.materials.append(mat('Shelf', (0.09, 0.08, 0.07), 0.3, 0.7))

    return objs

# ---------------------------------------------------------------- render/export
def setup_cycles_preview():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    for d in prefs.get_devices_for_type('METAL'):
        d.use = True
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 1000
    sc.render.resolution_y = 720
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX' if 'AgX' in [v.name for v in bpy.data.scenes[0].view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'

    world = bpy.data.worlds.new('W'); sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.02, 0.017, 0.014, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.3

    # warm key
    bpy.ops.object.light_add(type='AREA', location=(-2.2, -2.6, 3.2))
    key = bpy.context.active_object.data
    key.energy = 900; key.size = 2.5
    key.color = (1.0, 0.82, 0.58)
    bpy.context.active_object.rotation_euler = (math.radians(48), 0, math.radians(-35))
    # cool rim
    bpy.ops.object.light_add(type='AREA', location=(3.0, 2.4, 2.2))
    rim = bpy.context.active_object.data
    rim.energy = 300; rim.size = 2.0; rim.color = (0.5, 0.62, 1.0)

    bpy.ops.object.camera_add(location=(4.2, -4.6, 2.4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(68), 0, math.radians(42))
    cam.data.lens = 55
    sc.camera = cam

def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    reset()
    build()
    here = os.path.dirname(os.path.abspath(__file__))
    if '--export' in argv:
        # join all render-visible meshes and export
        bpy.ops.object.select_all(action='DESELECT')
        for o in bpy.data.objects:
            if o.type == 'MESH' and not o.hide_render:
                o.select_set(True)
        out = os.path.abspath(os.path.join(here, '../../public/models/workbench.glb'))
        bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
                                  export_draco_mesh_compression_enable=True)
        print('EXPORTED', out)
    else:
        setup_cycles_preview()
        out = os.path.join(here, '_preview_workbench.png')
        bpy.context.scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print('RENDERED', out)

main()
