"""
A detailed desktop FDM 3D printer (Ender-3 style bed-slinger), modeled in
Blender with beveled parts and real sub-assemblies: 2020 aluminium extrusion
frame, control box with fan grille, heated bed + build plate + clips, Z lead
screws / smooth rods / couplers, NEMA17 steppers, X-gantry with a full hotend
(heatsink fins, part-cooling fan, heater block, nozzle), belts, spool holder +
filament spool, LCD + rotary knob, wiring, and feet. Everything gets a bevel
so nothing reads as a raw primitive.

Run:  blender --background --python assets-src/blender/printer.py -- [--render|--export]
Preview -> assets-src/blender/_preview_printer.png
Export  -> public/models/printer.glb
"""

import bpy, bmesh, sys, math, os
from mathutils import Vector

# ------------------------------------------------------------------ helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

MATS = {}
def mat(name, color, metallic=0.0, rough=0.5, emit=None, emit_str=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_str
    MATS[name] = m
    return m

def _finish(o, m, bevel=0.008, seg=2):
    if bevel:
        bm = o.modifiers.new('bev', 'BEVEL')
        bm.width = bevel; bm.segments = seg; bm.limit_method = 'ANGLE'; bm.angle_limit = math.radians(40)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    if m:
        o.data.materials.append(m)
    return o

def box(size, loc, m, bevel=0.008, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    return _finish(o, m, bevel)

def cyl(r, h, loc, m, rot=(0, 0, 0), verts=24, bevel=0.004):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts, rotation=rot)
    return _finish(bpy.context.active_object, m, bevel, 1)

def extrusion(length, loc, axis='X', m=None):
    """A 2020-style extrusion: a beveled bar with a slot inset on each face."""
    size = {'X': (length, 0.2, 0.2), 'Y': (0.2, length, 0.2), 'Z': (0.2, 0.2, length)}[axis]
    bar = box(size, loc, m, bevel=0.02)
    # slot insets (thin darker recessed strips) — 4 faces
    slot_m = mat('slot', (0.05, 0.05, 0.06), 0.4, 0.7)
    half = 0.1
    if axis == 'X':
        for dy, dz in [(half, 0), (-half, 0), (0, half), (0, -half)]:
            s = (length + 0.02, 0.07, 0.02) if dz else (length + 0.02, 0.02, 0.07)
            box(s, (loc[0], loc[1] + dy, loc[2] + dz), slot_m, bevel=0)
    elif axis == 'Z':
        for dx, dy in [(half, 0), (-half, 0), (0, half), (0, -half)]:
            s = (0.07, 0.02, length + 0.02) if dy else (0.02, 0.07, length + 0.02)
            box(s, (loc[0] + dx, loc[1] + dy, loc[2]), slot_m, bevel=0)
    else:  # Y
        for dx, dz in [(half, 0), (-half, 0), (0, half), (0, -half)]:
            s = (0.07, length + 0.02, 0.02) if dz else (0.02, length + 0.02, 0.07)
            box(s, (loc[0] + dx, loc[1], loc[2] + dz), slot_m, bevel=0)
    return bar

def nema17(loc, m, shaft_dir='Z'):
    """A NEMA17 stepper: chamfered box body + boss + shaft."""
    body = box((0.42, 0.42, 0.34), loc, m, bevel=0.05)
    # rounded boss on the output face
    if shaft_dir == 'Z':
        cyl(0.11, 0.06, (loc[0], loc[1], loc[2] + 0.2), m, verts=20)
        cyl(0.025, 0.24, (loc[0], loc[1], loc[2] + 0.34), mat('steel', (0.6, 0.62, 0.66), 1.0, 0.25), verts=16)
    elif shaft_dir == 'Y':
        cyl(0.11, 0.06, (loc[0], loc[1] + 0.2, loc[2]), m, rot=(math.radians(90), 0, 0), verts=20)
        cyl(0.025, 0.24, (loc[0], loc[1] + 0.34, loc[2]), mat('steel', (0.6, 0.62, 0.66), 1.0, 0.25), rot=(math.radians(90), 0, 0), verts=16)
    return body

# ------------------------------------------------------------------ build
# Coordinate model (Ender-3 bed-slinger): origin at base center, +Z up, +Y back.
# Two Z posts stand at left/right toward the back; the bed slides on the base in
# front of them; the X gantry spans between the posts and carries the hotend.
def build():
    ALU = mat('alu', (0.28, 0.29, 0.32), 0.85, 0.38)
    BLK = mat('blk', (0.03, 0.03, 0.035), 0.2, 0.5)
    STEEL = mat('steel', (0.62, 0.64, 0.68), 1.0, 0.25)
    BED = mat('bed', (0.04, 0.05, 0.07), 0.3, 0.4)
    GLASS = mat('glass', (0.10, 0.14, 0.18), 0.1, 0.12)
    FIL = mat('fil', (0.80, 0.20, 0.12), 0.0, 0.55)
    SPOOL = mat('spool', (0.85, 0.83, 0.78), 0.0, 0.5)
    LCD = mat('lcd', (0.02, 0.15, 0.05), 0.0, 0.4, emit=(0.15, 0.9, 0.35), emit_str=1.2)
    BRASS = mat('brass', (0.8, 0.6, 0.25), 1.0, 0.3)
    HEATSINK = mat('heatsink', (0.5, 0.52, 0.55), 1.0, 0.3)

    H = 1.0            # half footprint (base is 2H x 2H)
    zb = 0.22          # base extrusion centre height
    yb = 0.82          # posts sit this far back
    posth = 2.3
    zpc = zb + posth / 2
    ztop = zb + posth  # top bar height
    gz = 1.2           # X-gantry height (printing position)

    # ---- base frame (square of extrusions) + control box + feet ----
    extrusion(2 * H, (0, -H, zb), 'X', ALU)
    extrusion(2 * H, (0, H, zb), 'X', ALU)
    extrusion(2 * H, (-H, 0, zb), 'Y', ALU)
    extrusion(2 * H, (H, 0, zb), 'Y', ALU)
    box((1.86, 1.86, 0.32), (0, 0, zb - 0.28), BLK, bevel=0.03)  # control box under base
    # fan grille on the front face
    grille = mat('grille', (0.09, 0.09, 0.1), 0.5, 0.5)
    cyl(0.22, 0.03, (0.5, -0.94, zb - 0.28), grille, rot=(math.radians(90), 0, 0), verts=28)
    for a in range(6):
        box((0.4, 0.03, 0.025), (0.5, -0.95, zb - 0.28), BLK, bevel=0, rot=(0, a / 6 * math.pi, 0))
    # power switch + socket
    box((0.16, 0.06, 0.12), (-0.6, -0.94, zb - 0.28), mat('sw', (0.4, 0.05, 0.05), 0.2, 0.6), bevel=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.1, 0.09, (sx * 0.9, sy * 0.9, zb - 0.46), BLK, verts=16)  # feet

    # ---- bed assembly on the base ----
    box((1.7, 1.7, 0.05), (0, 0, zb + 0.12), mat('ycar', (0.18, 0.18, 0.2), 0.6, 0.4), bevel=0.02)  # Y carriage
    box((1.5, 1.5, 0.05), (0, 0, zb + 0.18), BED, bevel=0.01)  # heated bed
    box((1.44, 1.44, 0.03), (0, 0, zb + 0.22), GLASS, bevel=0.006)  # glass/PEI
    for sx in (-1, 1):
        for sy in (-1, 1):
            box((0.14, 0.06, 0.05), (sx * 0.58, sy * 0.7, zb + 0.24), BLK, bevel=0.01)  # bed clips

    # ---- Z posts, top bar, Z motors, lead screws, rods ----
    for sx in (-1, 1):
        extrusion(posth, (sx * H, yb, zpc), 'Z', ALU)
        nema17((sx * (H - 0.16), yb, zb - 0.32), BLK, 'Z')                 # Z motor at base
        cyl(0.05, 0.14, (sx * (H - 0.16), yb, zb + 0.02), BLK, verts=14)   # coupler
        cyl(0.045, posth - 0.5, (sx * (H - 0.16), yb, zpc), BRASS, verts=8)  # lead screw
        # top corner bracket
        box((0.26, 0.24, 0.24), (sx * H, yb, ztop - 0.12), BLK, bevel=0.02)
    extrusion(2 * H, (0, yb, ztop), 'X', ALU)  # top bar

    # ---- X gantry (spans posts) + carriage + hotend + belt ----
    extrusion(2 * H, (0, yb - 0.14, gz), 'X', ALU)                 # gantry beam
    box((2 * H - 0.2, 0.02, 0.012), (0, yb - 0.06, gz + 0.07), mat('belt', (0.02, 0.02, 0.02), 0.1, 0.9), bevel=0)
    nema17((-H - 0.02, yb - 0.14, gz), BLK, 'Y')                   # X stepper on the left
    cx = 0.15
    box((0.42, 0.44, 0.5), (cx, yb - 0.32, gz), BLK, bevel=0.03)   # X carriage block
    hy = yb - 0.5                                                  # hotend hangs toward the bed
    for i in range(5):
        cyl(0.1, 0.02, (cx, hy, gz - 0.26 - i * 0.045), HEATSINK, rot=(math.radians(90), 0, 0), verts=16)  # fins
    box((0.16, 0.14, 0.11), (cx, hy, gz - 0.52), mat('heater', (0.55, 0.5, 0.45), 0.7, 0.4), bevel=0.01)    # heater block
    cyl(0.045, 0.1, (cx, hy, gz - 0.62), BRASS, verts=12)          # nozzle
    box((0.24, 0.1, 0.24), (cx + 0.27, hy + 0.05, gz - 0.34), BLK, bevel=0.02)  # part-cooling fan housing
    for a in range(7):
        box((0.16, 0.02, 0.03), (cx + 0.27, hy - 0.01, gz - 0.34), mat('blade', (0.15, 0.15, 0.17), 0.3, 0.5), bevel=0, rot=(0, a / 7 * math.pi, 0))
    # a half-printed part on the bed, under the nozzle
    cyl(0.16, 0.24, (cx, hy, zb + 0.34), FIL, verts=6)

    # ---- spool holder (on the top bar, reaching back) + spool ----
    box((0.1, 0.85, 0.1), (0.35, yb + 0.45, ztop + 0.02), ALU, bevel=0.02)
    sc = (0.35, yb + 0.88, ztop + 0.02)
    cyl(0.5, 0.04, (sc[0], sc[1] - 0.16, sc[2]), SPOOL, rot=(math.radians(90), 0, 0), verts=32)
    cyl(0.5, 0.04, (sc[0], sc[1] + 0.16, sc[2]), SPOOL, rot=(math.radians(90), 0, 0), verts=32)
    cyl(0.44, 0.28, (sc[0], sc[1], sc[2]), FIL, rot=(math.radians(90), 0, 0), verts=32)
    cyl(0.13, 0.36, (sc[0], sc[1], sc[2]), BLK, rot=(math.radians(90), 0, 0), verts=18)
    cyl(0.018, 0.9, (0.28, yb + 0.2, ztop - 0.35), FIL, rot=(math.radians(35), 0, 0), verts=6)  # filament run

    # ---- LCD + knob on a front bracket ----
    lb = (0.7, -H - 0.06, zb + 0.12)
    box((0.62, 0.1, 0.4), lb, BLK, bevel=0.03, rot=(math.radians(-22), 0, 0))
    box((0.46, 0.02, 0.24), (lb[0] - 0.05, lb[1] - 0.06, lb[2] + 0.02), LCD, bevel=0.005, rot=(math.radians(-22), 0, 0))
    cyl(0.07, 0.06, (lb[0] + 0.22, lb[1] - 0.07, lb[2] - 0.02), mat('knob', (0.1, 0.1, 0.12), 0.4, 0.5), rot=(math.radians(68), 0, 0), verts=20)

    # ---- wire loom rising from the control box to the gantry ----
    for t in [0.0, 0.22, 0.44, 0.66, 0.88]:
        z = zb + t * (gz - zb)
        y = -H + 0.12 + math.sin(t * 3) * 0.06
        cyl(0.05, 0.07, (-H + 0.08, y, z), mat('wire', (0.06, 0.06, 0.07), 0.1, 0.8), verts=8, bevel=0)


# ------------------------------------------------------------------ render / export
def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    for d in prefs.get_devices_for_type('METAL'):
        d.use = True
    sc.cycles.samples = 128
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 1000
    sc.render.resolution_y = 1000
    sc.render.film_transparent = False

    world = bpy.data.worlds.new('W'); sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.05, 0.06, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.5

    # ground plane so the machine casts contact shadows and reads as assembled
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.29))
    gp = bpy.context.active_object
    gm = mat('ground', (0.12, 0.12, 0.13), 0.0, 0.7)
    gp.data.materials.append(gm)

    bpy.ops.object.light_add(type='AREA', location=(3, -3.5, 4))
    k = bpy.context.active_object; k.data.energy = 1400; k.data.size = 4
    k.data.color = (1.0, 0.85, 0.62)
    k.rotation_euler = (math.radians(42), 0, math.radians(40))
    bpy.ops.object.light_add(type='AREA', location=(-3.5, 2.5, 3))
    r = bpy.context.active_object; r.data.energy = 500; r.data.size = 3; r.data.color = (0.55, 0.66, 1.0)

    bpy.ops.object.empty_add(location=(0, 0, 1.1))
    tgt = bpy.context.active_object
    bpy.ops.object.camera_add(location=(5.2, -6.0, 3.6))
    cam = bpy.context.active_object
    cam.data.lens = 55
    con = cam.constraints.new('TRACK_TO')
    con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'
    sc.camera = cam


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    reset()
    build()
    here = os.path.dirname(os.path.abspath(__file__))
    if '--export' in argv:
        bpy.ops.object.select_all(action='SELECT')
        # recenter on origin bottom
        out = os.path.abspath(os.path.join(here, '../../public/models/printer.glb'))
        bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
                                  export_yup=True, export_apply=True)
        print('EXPORTED', out)
    else:
        setup_scene()
        out = os.path.join(here, '_preview_printer.png')
        bpy.context.scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print('RENDERED', out)

main()
