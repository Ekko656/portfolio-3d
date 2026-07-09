"""
A gaming PC tower with a tempered-glass side panel showing the interior:
motherboard, GPU with dual fans + RGB, tower CPU cooler, RAM sticks with lit
tops, PSU shroud, front intake fans with RGB rings, a top exhaust fan, front
I/O (power button, USB, audio) and an RGB strip. Case is box-based so it
assembles cleanly. Teal RGB to match the scene's tech accent.

Run:  blender --background --python assets-src/blender/pc.py -- [--render|--export]
Preview -> assets-src/blender/_preview_pc.png
Export  -> public/models/pc.glb

Orientation (Blender, Z up): front I/O faces -Y, glass panel is +X.
"""

import bpy, sys, math, os

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

MATS = {}
def mat(name, color, metallic=0.0, rough=0.5, emit=None, emit_str=0.0, alpha=1.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if 'Alpha' in b.inputs:
        b.inputs['Alpha'].default_value = alpha
    if alpha < 1.0:
        m.blend_method = 'BLEND'
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_str
    MATS[name] = m
    return m

def _bevel(o, w=0.008, seg=2):
    bm = o.modifiers.new('b', 'BEVEL'); bm.width = w; bm.segments = seg
    bm.limit_method = 'ANGLE'; bm.angle_limit = math.radians(40)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='b')

def box(size, loc, m, bevel=0.008, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if bevel: _bevel(o, bevel)
    if m: o.data.materials.append(m)
    return o

def cyl(r, h, loc, m, rot=(0, 0, 0), verts=24, bevel=0.004):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts, rotation=rot)
    o = bpy.context.active_object
    if bevel: _bevel(o, bevel, 1)
    if m: o.data.materials.append(m)
    return o

def fan(loc, r, rgb, rot=(0, 0, 0)):
    """A case fan: housing ring + hub + blades + an emissive RGB ring."""
    housing = box((r * 2.1, r * 2.1, 0.09), loc, mat('fanbox', (0.05, 0.05, 0.06), 0.2, 0.6), 0.02, rot)
    cyl(r, 0.02, loc, mat('rgbring', (0.1, 0.9, 0.85), 0.0, 0.4, emit=rgb, emit_str=3.0), rot, verts=28, bevel=0)
    cyl(r * 0.28, 0.1, loc, mat('hub', (0.02, 0.02, 0.03), 0.2, 0.5), rot, verts=16)
    for a in range(7):
        box((r * 1.5, 0.02, 0.03), loc, mat('blade', (0.08, 0.08, 0.09), 0.1, 0.6), 0,
            (rot[0], rot[1], rot[2] + a / 7 * math.pi))
    return housing

def build():
    CASE = mat('case', (0.05, 0.05, 0.055), 0.5, 0.4)
    STEEL = mat('steel', (0.28, 0.29, 0.32), 0.8, 0.35)
    GLASS = mat('glass', (0.1, 0.13, 0.16), 0.0, 0.05, alpha=0.28)
    PCB = mat('pcb', (0.02, 0.12, 0.06), 0.2, 0.5)
    RGB = (0.15, 0.95, 0.85)  # teal
    RGBM = mat('rgbstrip', (0.1, 0.9, 0.85), 0.0, 0.4, emit=RGB, emit_str=2.5)

    W, D, H = 1.1, 2.1, 2.3   # width(X), depth(Y), height(Z)
    hx, hy = W / 2, D / 2

    # ---- chassis: 5 panels (open on +X where the glass goes) ----
    box((W, D, 0.06), (0, 0, 0.03), CASE, 0.01)         # bottom
    box((W, D, 0.06), (0, 0, H), CASE, 0.01)            # top
    box((0.06, D, H), (-hx, 0, H / 2), CASE, 0.01)      # left (motherboard tray side)
    box((W, 0.06, H), (0, hy, H / 2), CASE, 0.01)       # back
    box((W, 0.06, H), (0, -hy, H / 2), CASE, 0.01)      # front
    # tempered glass side panel (+X) with 4 thumbscrews
    box((0.03, D - 0.12, H - 0.12), (hx, 0, H / 2), GLASS, 0)
    for sx, sy in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
        cyl(0.04, 0.05, (hx + 0.02, sy * (hy - 0.1), H / 2 + sx * (H / 2 - 0.12)), STEEL, (0, math.radians(90), 0), 8)
    # feet
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.07, 0.06, (sx * (hx - 0.12), sy * (hy - 0.15), -0.02), mat('foot', (0.02, 0.02, 0.02), 0, 0.9), verts=10)

    # ---- PSU shroud along the bottom ----
    box((W - 0.14, D - 0.14, 0.42), (0, 0, 0.28), mat('shroud', (0.04, 0.04, 0.045), 0.4, 0.5), 0.01)
    box((0.4, 0.5, 0.03), (0.1, 0.2, 0.5), RGBM, 0)  # a little RGB accent line on the shroud

    # ---- motherboard on the left inner wall (+X facing) ----
    box((0.04, D - 0.35, H - 0.75), (-hx + 0.08, 0.05, 1.35), PCB, 0)
    # CPU cooler (tower) near the top, with a lit top fan
    box((0.34, 0.34, 0.5), (-0.1, 0.35, 1.85), mat('cooler', (0.4, 0.42, 0.45), 0.9, 0.3), 0.02)
    fan((-0.1, 0.35, 2.12), 0.2, RGB, (0, 0, 0))
    # RAM sticks with lit tops
    for i in range(4):
        box((0.04, 0.12, 0.42), (-0.1 + 0.06 * i, -0.1 - i * 0.001, 1.7), mat('ram', (0.05, 0.05, 0.06), 0.3, 0.5), 0.004)
        box((0.04, 0.12, 0.03), (-0.1 + 0.06 * i, -0.1, 1.92), RGBM, 0)

    # ---- GPU: big horizontal card with dual fans + RGB, mid-height ----
    box((0.5, 1.3, 0.22), (0.02, -0.1, 1.15), mat('gpu', (0.04, 0.04, 0.05), 0.4, 0.5), 0.02)
    box((0.5, 1.25, 0.02), (0.02, -0.1, 1.04), RGBM, 0)  # underglow strip
    for fy in (-0.45, 0.35):
        fan((0.02, fy, 1.04), 0.19, RGB, (math.radians(90), 0, 0))
    # GPU support bracket
    box((0.05, 0.05, 0.7), (0.25, -0.7, 0.8), STEEL, 0.01)

    # ---- front intake fans (face -Y) with RGB ----
    for fz in (0.75, 1.45):
        fan((0.05, -hy + 0.05, fz), 0.24, RGB, (math.radians(90), 0, 0))
    # ---- top exhaust fan ----
    fan((0.15, 0.4, H - 0.02), 0.22, RGB, (0, 0, 0))

    # ---- front I/O strip (-Y): power button, USB, audio, RGB accent ----
    box((0.5, 0.03, 0.06), (0, -hy - 0.02, H - 0.2), RGBM, 0)  # top RGB accent
    cyl(0.05, 0.04, (-0.3, -hy - 0.02, H - 0.45), STEEL, (math.radians(90), 0, 0), 16)  # power button
    for i in range(2):
        box((0.09, 0.04, 0.04), (-0.05 + i * 0.14, -hy - 0.02, H - 0.45), mat('usb', (0.1, 0.1, 0.12), 0.6, 0.4), 0.005)
    # a small front power LED (lit)
    box((0.03, 0.03, 0.03), (0.3, -hy - 0.02, H - 0.45), mat('led', (0.6, 1.0, 0.9), 0, 0.3, emit=RGB, emit_str=4))

    # ---- a couple of internal cables ----
    box((0.03, 0.03, 0.5), (0.2, 0.7, 0.7), mat('cable', (0.02, 0.02, 0.02), 0.1, 0.8), 0, (0.3, 0, 0))
    box((0.03, 0.4, 0.03), (0.2, 0.5, 0.55), mat('cable2', (0.02, 0.02, 0.02), 0.1, 0.8), 0)


def setup_scene(front=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'GPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    for d in prefs.get_devices_for_type('METAL'):
        d.use = True
    sc.cycles.samples = 128
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 800
    sc.render.resolution_y = 900

    world = bpy.data.worlds.new('W'); sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.03, 0.03, 0.04, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.4
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.03))
    bpy.context.active_object.data.materials.append(mat('gp', (0.1, 0.1, 0.11), 0, 0.7))

    bpy.ops.object.light_add(type='AREA', location=(-3, -3.5, 4))
    k = bpy.context.active_object; k.data.energy = 1200; k.data.size = 4; k.data.color = (1.0, 0.85, 0.6)
    bpy.ops.object.light_add(type='AREA', location=(3, 2, 3))
    r = bpy.context.active_object; r.data.energy = 400; r.data.size = 3; r.data.color = (0.5, 0.7, 1.0)

    bpy.ops.object.empty_add(location=(0, 0, 1.1))
    tgt = bpy.context.active_object
    bpy.ops.object.camera_add(location=(-4.2, -5.2, 2.6))
    cam = bpy.context.active_object
    cam.data.lens = 55
    con = cam.constraints.new('TRACK_TO'); con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    sc.camera = cam


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    reset()
    build()
    here = os.path.dirname(os.path.abspath(__file__))
    if '--export' in argv:
        bpy.ops.object.select_all(action='SELECT')
        out = os.path.abspath(os.path.join(here, '../../public/models/pc.glb'))
        bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
        print('EXPORTED', out)
    else:
        setup_scene()
        out = os.path.join(here, '_preview_pc.png')
        bpy.context.scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print('RENDERED', out)

main()
