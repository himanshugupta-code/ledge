import bpy
import bmesh
import math
import os
import random
from mathutils import Matrix, Vector

OUT = globals().get("KIT_OUT") or os.path.expanduser("~/work/ledge/site/public/city/city-kit.glb")
KIT = "LedgeCityKit"


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def material(name, color, metal=0.0, rough=0.6, emit=None, strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*srgb(color), 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        b.inputs["Emission Strength"].default_value = strength
    m.diffuse_color = (*srgb(color), 1)
    return m


M = {
    "Paint": material("Paint", "#2d6bff", 0.6, 0.28),
    "Glass": material("Glass", "#0c1220", 0.9, 0.08),
    "Trim": material("Trim", "#15181f", 0.3, 0.6),
    "Chrome": material("Chrome", "#d9dde6", 1.0, 0.15),
    "Headlight": material("Headlight", "#fff3d6", 0, 0.3, "#fff3d6", 6),
    "Taillight": material("Taillight", "#ff3b4a", 0, 0.3, "#ff3b4a", 5),
    "Tire": material("Tire", "#121317", 0, 0.85),
    "Rim": material("Rim", "#9aa3b5", 0.9, 0.3),
    "Stripe": material("Stripe", "#f4f6ff", 0, 0.4, "#f4f6ff", 1.5),
    "Skin": material("Skin", "#f1c7a4", 0, 0.55),
    "Hoodie": material("Hoodie", "#ff9a3c", 0, 0.7),
    "Pants": material("Pants", "#1f2a4a", 0, 0.75),
    "Shoe": material("Shoe", "#f4f4f6", 0, 0.5),
    "Hair": material("Hair", "#2a1d17", 0, 0.8),
    "Eye": material("Eye", "#0b0d12", 0, 0.3),
    "Concrete": material("Concrete", "#3b4256", 0.1, 0.8),
    "ConcreteDark": material("ConcreteDark", "#252a39", 0.1, 0.85),
    "Roof": material("Roof", "#1b2030", 0, 0.9),
    "WindowLit": material("WindowLit", "#ffd59a", 0, 0.3, "#ffb866", 1.4),
    "WindowCool": material("WindowCool", "#bcd2ff", 0, 0.3, "#8fb0ff", 1.2),
    "WindowDark": material("WindowDark", "#0d1322", 0.8, 0.12),
    "Accent": material("Accent", "#6e95ff", 0, 0.4, "#6e95ff", 4),
    "Beacon": material("Beacon", "#ff3040", 0, 0.4, "#ff3040", 8),
    "Awning": material("Awning", "#e0475b", 0, 0.7),
    "Sign": material("Sign", "#ff5fd2", 0, 0.4, "#ff5fd2", 5),
    "Metal": material("Metal", "#2c3244", 0.7, 0.4),
    "LampGlow": material("LampGlow", "#ffdeaa", 0, 0.4, "#ffdeaa", 10),
    "Bark": material("Bark", "#3b2c22", 0, 0.9),
    "Leaf": material("Leaf", "#2a7a5a", 0, 0.75),
    "LeafLight": material("LeafLight", "#3f9a6e", 0, 0.75),
}


class Part:
    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def mi(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    def _faces(self, verts):
        return list({f for v in verts for f in v.link_faces})

    def box(self, c, s, mat, bevel=0.0, seg=2):
        r = bmesh.ops.create_cube(self.bm, size=1.0)
        vs = r["verts"]
        for v in vs:
            v.co = Vector((v.co.x * s[0] + c[0], v.co.y * s[1] + c[1], v.co.z * s[2] + c[2]))
        fs = self._faces(vs)
        for f in fs:
            f.material_index = self.mi(mat)
        if bevel:
            es = list({e for f in fs for e in f.edges})
            bmesh.ops.bevel(self.bm, geom=es + vs, offset=bevel, segments=seg, affect="EDGES", profile=0.5, clamp_overlap=True)
        return vs

    def cyl(self, c, r1, depth, mat, axis="Z", seg=16, r2=None, smooth=False, caps=True):
        rot = Matrix.Identity(4)
        if axis == "X":
            rot = Matrix.Rotation(math.pi / 2, 4, "Y")
        elif axis == "Y":
            rot = Matrix.Rotation(math.pi / 2, 4, "X")
        mtx = Matrix.Translation(Vector(c)) @ rot
        res = bmesh.ops.create_cone(self.bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1, radius2=r1 if r2 is None else r2, depth=depth, matrix=mtx)
        fs = self._faces(res["verts"])
        for f in fs:
            f.material_index = self.mi(mat)
            if smooth and len(f.verts) == 4:
                f.smooth = True
        return res["verts"]

    def ball(self, c, r, mat, sub=2, scale=(1, 1, 1), smooth=True, jitter=0.0, rng=None):
        res = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r)
        for v in res["verts"]:
            j = 1 + (rng.uniform(-jitter, jitter) if rng else 0)
            v.co = Vector((v.co.x * scale[0] * j + c[0], v.co.y * scale[1] * j + c[1], v.co.z * scale[2] * j + c[2]))
        for f in self._faces(res["verts"]):
            f.material_index = self.mi(mat)
            f.smooth = smooth
        return res["verts"]

    def quad(self, pts, mat):
        vs = [self.bm.verts.new(Vector(p)) for p in pts]
        f = self.bm.faces.new(vs)
        f.material_index = self.mi(mat)
        return f

    def prism(self, profile, x0, x1, side_mat, mats=None, bevel=0.0, seg=3):
        vs = [self.bm.verts.new(Vector((x0, y, z))) for y, z in profile]
        cap = self.bm.faces.new(vs)
        cap.material_index = self.mi(side_mat)
        ext = bmesh.ops.extrude_face_region(self.bm, geom=[cap])
        nv = [g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(self.bm, verts=nv, vec=Vector((x1 - x0, 0, 0)))
        ring = [g for g in ext["geom"] if isinstance(g, bmesh.types.BMFace)]
        bmesh.ops.recalc_face_normals(self.bm, faces=list(self.bm.faces))
        if mats:
            for f in ring:
                if f is cap or abs(f.normal.x) > 0.9:
                    continue
                c = f.calc_center_median()
                f.material_index = self.mi(mats(c, f.normal))
        if bevel:
            caps = [f for f in self.bm.faces if abs(f.normal.x) > 0.99 and f.material_index == self.mi(side_mat)]
            es = list({e for f in caps for e in f.edges})
            bmesh.ops.bevel(self.bm, geom=es, offset=bevel, segments=seg, affect="EDGES", profile=0.5, clamp_overlap=True)

    def build(self, name, loc=(0, 0, 0), parent=None, coll=None):
        bmesh.ops.remove_doubles(self.bm, verts=list(self.bm.verts), dist=1e-5)
        bmesh.ops.recalc_face_normals(self.bm, faces=list(self.bm.faces))
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(M[m])
        ob = bpy.data.objects.new(name, me)
        ob.location = loc
        (coll or kit_coll).objects.link(ob)
        if parent:
            ob.parent = parent
        return ob


def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.5
    e.location = loc
    kit_coll.objects.link(e)
    return e


def arc(cy, cz, r, a0, a1, n):
    return [(cy + r * math.cos(a0 + (a1 - a0) * i / n), cz + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def make_car(at):
    root = empty("Car", at)
    hw = 0.98
    floor = 0.3
    wr = 0.53
    wz = 0.42
    out = [(-2.18, floor)]
    for cy in (-1.35, 1.35):
        dy = math.sqrt(wr * wr - (floor - wz) ** 2)
        a0 = math.atan2(floor - wz, -dy)
        a1 = math.atan2(floor - wz, dy)
        if a0 < 0:
            a0 += 2 * math.pi
        out += arc(cy, wz, wr, a0, a1, 12)
    out += [(2.2, floor), (2.27, 0.46), (2.27, 0.86), (2.14, 1.0), (1.2, 1.04), (-0.72, 1.0), (-1.85, 0.86), (-2.2, 0.74), (-2.27, 0.52)]
    body = Part()
    body.prism(out, -hw, hw, "Paint", bevel=0.07, seg=3)
    cabin = [(-0.7, 1.0), (1.85, 1.03), (1.0, 1.5), (0.0, 1.53)]

    def cab_mat(c, n):
        if n.z > 0.95:
            return "Paint"
        if n.z < -0.5:
            return "Trim"
        return "Glass"

    body.prism(cabin, -0.84, 0.84, "Glass", mats=cab_mat)
    body.box((0, 0.5, 1.535), (1.5, 0.95, 0.04), "Paint", bevel=0.015)
    for s in (-1, 1):
        body.box((s * 0.62, -2.2, 0.68), (0.5, 0.1, 0.11), "Headlight", bevel=0.03)
        body.box((s * 0.995, 0.0, 0.64), (0.02, 3.3, 0.06), "Stripe")
        body.box((s * 1.02, -0.55, 1.07), (0.14, 0.1, 0.1), "Paint", bevel=0.02)
        body.box((s * 0.55, 1.98, 1.13), (0.06, 0.08, 0.16), "Trim")
    body.box((0, -2.25, 0.46), (0.95, 0.06, 0.18), "Trim", bevel=0.02)
    body.box((0, -2.24, 0.33), (1.7, 0.12, 0.06), "Trim")
    body.box((0, 2.27, 0.82), (1.75, 0.04, 0.09), "Taillight")
    body.box((0, 2.0, 1.22), (1.6, 0.34, 0.04), "Trim", bevel=0.015)
    body.box((0, 0, 0.36), (1.6, 3.2, 0.1), "Trim")
    body.build("Car_Body", parent=root)
    for side, x in (("L", -0.9), ("R", 0.9)):
        for end, y in (("F", -1.35), ("B", 1.35)):
            w = Part()
            w.cyl((0, 0, 0), wz, 0.3, "Tire", axis="X", seg=22, smooth=True)
            w.cyl((0, 0, 0), 0.27, 0.31, "Rim", axis="X", seg=10)
            for k in range(5):
                a = k / 5 * math.pi * 2
                w.box((0, math.cos(a) * 0.15, math.sin(a) * 0.15), (0.33, 0.06, 0.06), "Chrome")
            w.cyl((0, 0, 0), 0.07, 0.34, "Chrome", axis="X", seg=8)
            w.build(f"Wheel_{end}{side}", loc=(x, y, wz), parent=root)
    return root


def make_person(at):
    root = empty("Person", at)
    t = Part()
    t.box((0, 0, 1.3), (0.68, 0.4, 0.74), "Hoodie", bevel=0.12, seg=3)
    t.box((0, 0.12, 1.62), (0.5, 0.22, 0.18), "Hoodie", bevel=0.08)
    t.box((0, -0.205, 1.18), (0.44, 0.02, 0.18), "Hoodie")
    t.box((0, 0, 0.94), (0.5, 0.32, 0.2), "Pants", bevel=0.05)
    t.cyl((0, 0, 1.72), 0.1, 0.14, "Skin", seg=10)
    t.ball((0, 0, 1.95), 0.27, "Skin", sub=3)
    t.ball((0, 0.03, 2.03), 0.285, "Hair", sub=2, scale=(1.02, 1.02, 0.8))
    for s in (-1, 1):
        t.box((s * 0.09, -0.245, 1.97), (0.05, 0.03, 0.07), "Eye")
        t.ball((s * 0.27, 0, 1.95), 0.06, "Skin", sub=1)
    t.build("Person_Body", parent=root)
    for side, x in (("L", -0.15), ("R", 0.15)):
        g = Part()
        g.cyl((0, 0, -0.38), 0.13, 0.78, "Pants", seg=10, r2=0.11, smooth=True)
        g.box((0, -0.05, -0.8), (0.19, 0.34, 0.13), "Shoe", bevel=0.04)
        g.build(f"Leg_{side}", loc=(x, 0, 0.9), parent=root)
    for side, x in (("L", -0.44), ("R", 0.44)):
        a = Part()
        a.cyl((0, 0, -0.27), 0.1, 0.58, "Hoodie", seg=10, r2=0.09, smooth=True)
        a.ball((0, 0, -0.62), 0.085, "Skin", sub=2)
        a.build(f"Arm_{side}", loc=(x, 0, 1.55), parent=root)
    return root


def make_lamp(at):
    root = empty("Lamp", at)
    p = Part()
    p.cyl((0, 0, 0.2), 0.22, 0.4, "Metal", seg=8)
    p.cyl((0, 0, 2.6), 0.07, 4.8, "Metal", seg=8, r2=0.05)
    p.cyl((0, 0, 5.1), 0.42, 0.18, "Metal", seg=12, r2=0.24)
    p.cyl((0, 0, 4.99), 0.34, 0.04, "LampGlow", seg=12)
    p.build("Lamp_Mesh", parent=root)
    return root


def make_tree(at, rng):
    root = empty("Tree", at)
    p = Part()
    p.cyl((0, 0, 0.9), 0.22, 1.8, "Bark", seg=7, r2=0.14)
    p.ball((0, 0, 2.7), 1.5, "Leaf", sub=1, scale=(1, 1, 0.9), smooth=False, jitter=0.12, rng=rng)
    p.ball((0.5, 0.3, 3.7), 1.05, "LeafLight", sub=1, smooth=False, jitter=0.12, rng=rng)
    p.ball((-0.4, -0.3, 4.4), 0.75, "Leaf", sub=1, smooth=False, jitter=0.12, rng=rng)
    p.build("Tree_Mesh", parent=root)
    return root


import numpy as np

TEX = 256


def _noise(h, w, amt, rng):
    return rng.normal(0, amt, (h, w, 1))


def _hex(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def paint_grid(wall, glass, frame, cols, rows, ww, wh, wy, seed, curtain=False, ribbon=False, blinds=0.2, brick=False, mull=False):
    rng = np.random.default_rng(seed)
    img = np.ones((TEX, TEX, 3)) * _hex(wall)
    img += _noise(TEX, TEX, 0.018, rng)
    if brick:
        bh = 5
        for r in range(0, TEX, bh):
            off = 0 if (r // bh) % 2 == 0 else 6
            for c in range(-12 + off, TEX, 12):
                tint = rng.normal(0, 0.035, 3)
                img[r:r + bh - 1, max(0, c):max(0, c + 11)] += tint
            img[r + bh - 1:r + bh, :] = _hex(wall) * 0.72
    cw = TEX / cols
    rh = TEX / rows
    g0 = _hex(glass)
    fr = _hex(frame)
    for r in range(rows):
        for c in range(cols):
            if ribbon:
                x0, x1 = int(c * cw), int((c + 1) * cw)
            else:
                x0 = int(c * cw + cw * (1 - ww) / 2)
                x1 = int(c * cw + cw * (1 + ww) / 2)
            y0 = int(r * rh + rh * wy)
            y1 = int(y0 + rh * wh)
            hgt = max(1, y1 - y0)
            grad = np.linspace(-0.05, 0.12, hgt)[:, None, None]
            tint = rng.normal(0, 0.03, 3)
            pane = g0 + tint + grad
            img[y0:y1, x0:x1] = pane
            if rng.random() < blinds:
                bl = int(hgt * rng.uniform(0.3, 0.7))
                img[y1 - bl:y1, x0:x1] = img[y1 - bl:y1, x0:x1] * 0.4 + np.array([0.86, 0.85, 0.8]) * 0.6
            t = 2 if not curtain else 1
            img[y0:y0 + t, x0:x1] = fr
            img[y1 - t:y1, x0:x1] = fr
            img[y0:y1, x0:x0 + t] = fr
            img[y0:y1, x1 - t:x1] = fr
            if mull or curtain:
                mx = (x0 + x1) // 2
                img[y0:y1, mx:mx + 1] = fr
            if not curtain and not ribbon:
                img[max(0, y0 - 3):y0, max(0, x0 - 2):x1 + 2] = np.clip(_hex(wall) * 1.18, 0, 1)
    return np.clip(img, 0, 1)


def paint_shop(seed):
    rng = np.random.default_rng(seed)
    img = np.ones((TEX, TEX, 3)) * _hex("#2a2d35")
    img += _noise(TEX, TEX, 0.015, rng)
    signs = ["#c8372d", "#1f6fd1", "#e2a72e", "#2c9d6c", "#7a3fb8", "#e8e2d6"]
    cols = 4
    cw = TEX / cols
    for c in range(cols):
        x0, x1 = int(c * cw + 5), int((c + 1) * cw - 5)
        img[20:180, x0:x1] = _hex("#5b7d96") + np.linspace(-0.08, 0.14, 160)[:, None, None]
        img[20:180, (x0 + x1) // 2:(x0 + x1) // 2 + 2] = _hex("#1a1c22")
        if c % 2 == 0:
            img[20:120, x0 + 10:x0 + 40] = _hex("#3a2b22")
        img[196:236, x0:x1] = _hex(rng.choice(signs))
        img[210:222, x0 + 12:x1 - 12] = np.clip(img[210:222, x0 + 12:x1 - 12] + 0.35, 0, 1)
    img[180:192, :] = _hex("#9a9ea8")
    return np.clip(img, 0, 1)


def paint_roof(seed):
    rng = np.random.default_rng(seed)
    img = np.ones((TEX, TEX, 3)) * _hex("#8d9098")
    img += _noise(TEX, TEX, 0.03, rng)
    for _ in range(14):
        x, y, r = rng.integers(0, TEX, 2).tolist() + [int(rng.integers(8, 40))]
        yy, xx = np.ogrid[:TEX, :TEX]
        m = ((xx - x) ** 2 + (yy - y) ** 2) < r * r
        img[m] *= rng.uniform(0.88, 0.97)
    img[::64, :] *= 0.85
    img[:, ::64] *= 0.85
    return np.clip(img, 0, 1)


FACADES = {
    "F_GlassBlue": dict(wall="#24364f", glass="#3d6f9e", frame="#1a2433", cols=4, rows=4, ww=0.96, wh=0.82, wy=0.09, curtain=True, blinds=0.08, tile=(6.0, 12.8), metal=0.4, rough=0.25),
    "F_GlassGreen": dict(wall="#1f3f3c", glass="#3f8f86", frame="#cfd8d6", cols=4, rows=4, ww=0.9, wh=0.8, wy=0.1, curtain=True, blinds=0.1, tile=(6.0, 12.8), metal=0.35, rough=0.3),
    "F_GlassDark": dict(wall="#141b28", glass="#2a3e5c", frame="#8e9bb3", cols=4, rows=4, ww=0.9, wh=0.86, wy=0.07, curtain=True, blinds=0.05, tile=(6.0, 12.8), metal=0.45, rough=0.22),
    "F_Stone": dict(wall="#c9b48e", glass="#3b5470", frame="#e9dfc9", cols=4, rows=4, ww=0.42, wh=0.5, wy=0.28, blinds=0.25, tile=(8.0, 12.8), metal=0.0, rough=0.85),
    "F_Brick": dict(wall="#8a3f2c", glass="#2f4357", frame="#efe7da", cols=4, rows=4, ww=0.4, wh=0.52, wy=0.26, brick=True, blinds=0.3, mull=True, tile=(8.0, 12.8), metal=0.0, rough=0.9),
    "F_White": dict(wall="#e6e7e9", glass="#3f7f95", frame="#2c3540", cols=4, rows=4, ww=1.0, wh=0.42, wy=0.34, ribbon=True, blinds=0.1, tile=(8.0, 12.8), metal=0.05, rough=0.6),
    "F_Grid": dict(wall="#eef0f2", glass="#2f73b8", frame="#d5dae0", cols=4, rows=4, ww=0.78, wh=0.72, wy=0.14, blinds=0.12, mull=True, tile=(7.2, 12.8), metal=0.15, rough=0.45),
    "F_Cream": dict(wall="#e8d9b8", glass="#41586d", frame="#ffffff", cols=4, rows=4, ww=0.48, wh=0.55, wy=0.24, blinds=0.3, mull=True, tile=(8.0, 12.8), metal=0.0, rough=0.8),
    "F_Salmon": dict(wall="#e4b7a0", glass="#48647c", frame="#f6f1ea", cols=4, rows=4, ww=0.5, wh=0.55, wy=0.24, blinds=0.3, mull=True, tile=(8.0, 12.8), metal=0.0, rough=0.8),
}


def tex_material(name, arr, metal, rough):
    img = bpy.data.images.get(name) or bpy.data.images.new(name, TEX, TEX, alpha=False)
    rgba = np.concatenate([arr, np.ones((TEX, TEX, 1))], axis=2).astype(np.float32)
    img.pixels.foreach_set(rgba.ravel())
    img.update()
    img.pack()
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    t = nt.nodes.get("Facade") or nt.nodes.new("ShaderNodeTexImage")
    t.name = "Facade"
    t.image = img
    t.extension = "REPEAT"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*arr.reshape(-1, 3).mean(0), 1)
    M[name] = m
    return m


TILE = {}
for k, v in FACADES.items():
    v = dict(v)
    TILE[k] = v.pop("tile")
    metal, rough = v.pop("metal"), v.pop("rough")
    tex_material(k, paint_grid(seed=sum(map(ord, k)), **v), metal, rough)
tex_material("F_Shop", paint_shop(4), 0.1, 0.5)
TILE["F_Shop"] = (12.0, 4.6)
tex_material("F_Roof", paint_roof(9), 0.0, 0.9)
TILE["F_Roof"] = (16.0, 16.0)
M["Crane"] = material("Crane", "#f2b31b", 0.2, 0.5)
M["Pool"] = material("Pool", "#3cc4e6", 0.1, 0.1)
M["GreenRoof"] = material("GreenRoof", "#5d8f43", 0, 0.9)
M["Skylight"] = material("Skylight", "#9fc6e6", 0.6, 0.1)
M["RoofMetal"] = material("RoofMetal", "#c5c9d1", 0.6, 0.35)
M["Cornice"] = material("Cornice", "#d8d3c6", 0.0, 0.7)
M["Slab"] = material("Slab", "#a7a9ad", 0.0, 0.85)
M["Band"] = material("Band", "#e9ecf0", 0.1, 0.5)
M["Fence"] = material("Fence", "#e46b2a", 0.0, 0.6)


def rect(w, d, r=0.0, seg=5):
    if r <= 0:
        return [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]
    pts = []
    for cx, cy, a0 in ((w / 2 - r, -d / 2 + r, -math.pi / 2), (w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, math.pi / 2), (-w / 2 + r, -d / 2 + r, math.pi)):
        for i in range(seg + 1):
            a = a0 + (math.pi / 2) * i / seg
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def ellipse(rx, ry, seg=40):
    return [(rx * math.cos(2 * math.pi * i / seg), ry * math.sin(2 * math.pi * i / seg)) for i in range(seg)]


def chamfer(w, d, c):
    return [(-w / 2 + c, -d / 2), (w / 2 - c, -d / 2), (w / 2, -d / 2 + c), (w / 2, d / 2 - c), (w / 2 - c, d / 2), (-w / 2 + c, d / 2), (-w / 2, d / 2 - c), (-w / 2, -d / 2 + c)]


def curved_end(w, d, seg=12):
    r = d / 2
    pts = [(-w / 2, -d / 2), (w / 2 - r, -d / 2)]
    for i in range(1, seg):
        a = -math.pi / 2 + math.pi * i / seg
        pts.append((w / 2 - r + r * math.cos(a), r * math.sin(a)))
    pts += [(w / 2 - r, d / 2), (-w / 2, d / 2)]
    return pts


def scaled(poly, s, dx=0.0, dy=0.0):
    return [(x * s + dx, y * s + dy) for x, y in poly]


def grow(poly, g):
    out = []
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i - 1]
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        n1 = Vector((y1 - y0, -(x1 - x0))).normalized()
        n2 = Vector((y2 - y1, -(x2 - x1))).normalized()
        nn = (n1 + n2)
        if nn.length < 1e-6:
            nn = n1
        nn.normalize()
        k = g / max(0.35, nn.dot(n1))
        out.append((x1 + nn.x * k, y1 + nn.y * k))
    return out


def ccw(poly):
    a = sum(poly[i - 1][0] * poly[i][1] - poly[i][0] * poly[i - 1][1] for i in range(len(poly)))
    return poly if a > 0 else poly[::-1]


def mass(p, poly, rings, mat, roof="F_Roof", smooth=False, zbase=None, top=True):
    poly = ccw(poly)
    bm = p.bm
    uv = bm.loops.layers.uv.verify()
    n = len(poly)
    tw, th = TILE.get(mat, (8.0, 12.8))
    zb = rings[0][0] if zbase is None else zbase
    cum = [0.0]
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    per = cum[-1]
    reps = max(1, round(per / tw))
    rows = []
    for z, s in rings:
        rows.append([bm.verts.new(Vector((x * s, y * s, z))) for x, y in poly])
    mi = p.mi(mat)
    for k in range(len(rings) - 1):
        za, zb2 = rings[k][0], rings[k + 1][0]
        for i in range(n):
            j = (i + 1) % n
            f = bm.faces.new((rows[k][i], rows[k][j], rows[k + 1][j], rows[k + 1][i]))
            f.material_index = mi
            f.smooth = smooth
            u0, u1 = cum[i] / per * reps, cum[i + 1] / per * reps
            for loop, (u, z) in zip(f.loops, ((u0, za), (u1, za), (u1, zb2), (u0, zb2))):
                loop[uv].uv = (u, (z - zb) / th)
    if top:
        f = bm.faces.new(rows[-1])
        f.material_index = p.mi(roof)
        rtw = TILE.get(roof, (16.0, 16.0))[0]
        for loop in f.loops:
            loop[uv].uv = (loop.vert.co.x / rtw, loop.vert.co.y / rtw)
    return rows[-1]


def slab(p, poly, z0, z1, mat, g=0.0):
    return mass(p, grow(ccw(poly), g) if g else poly, [(z0, 1), (z1, 1)], mat, roof=mat)


def floors(z0, nfl, fh=3.2):
    return z0 + nfl * fh


def roof_stuff(p, rng, w, d, z, n_ac=3, skylight=False, pool=False, green=False, tank=False, bulk=True, heli=False):
    def spot(sw, sd):
        return rng.uniform(-w / 2 + sw / 2 + 0.8, w / 2 - sw / 2 - 0.8), rng.uniform(-d / 2 + sd / 2 + 0.8, d / 2 - sd / 2 - 0.8)

    if bulk:
        x, y = spot(2.6, 2.2)
        p.box((x, y, z + 1.2), (2.6, 2.2, 2.4), "Cornice")
    for _ in range(n_ac):
        x, y = spot(1.6, 1.2)
        p.box((x, y, z + 0.5), (1.6, 1.2, 1.0), "RoofMetal", bevel=0.04)
        p.cyl((x, y, z + 1.04), 0.4, 0.08, "Trim", seg=10)
    if skylight and w > 6 and d > 6:
        x, y = spot(3.2, 2.2)
        p.box((x, y, z + 0.35), (3.2, 2.2, 0.7), "Skylight", bevel=0.05)
    if pool and w > 8 and d > 7:
        x, y = spot(5, 2.6)
        p.box((x, y, z + 0.06), (5.4, 3.0, 0.12), "Cornice")
        p.box((x, y, z + 0.13), (5.0, 2.6, 0.04), "Pool")
    if green and w > 7:
        x, y = spot(4, 3)
        p.box((x, y, z + 0.1), (4, 3, 0.2), "GreenRoof")
    if tank:
        x, y = spot(2.2, 2.2)
        for sx in (-1, 1):
            for sy in (-1, 1):
                p.cyl((x + sx * 0.7, y + sy * 0.7, z + 0.8), 0.06, 1.6, "Metal", seg=6)
        p.cyl((x, y, z + 2.4), 1.0, 1.6, "Bark", seg=14)
        p.cyl((x, y, z + 3.45), 1.05, 0.5, "Bark", seg=14, r2=0.15)
    if heli:
        p.cyl((0, 0, z + 0.25), min(w, d) * 0.38, 0.5, "Slab", seg=28)
        p.cyl((0, 0, z + 0.52), min(w, d) * 0.3, 0.04, "Accent", seg=28)


def parapet(p, poly, z, h=0.7, mat="Cornice", g=0.15):
    mass(p, grow(ccw(poly), g), [(z, 1), (z + h, 1)], mat, roof="F_Roof")


def podium(p, poly, h=4.6):
    mass(p, poly, [(0, 1), (h, 1)], "F_Shop", top=False)
    slab(p, poly, h - 0.05, h + 0.35, "Cornice", g=0.25)
    return h + 0.35


def bands(p, poly, z0, z1, every, mat="Band", g=0.12):
    z = z0 + every
    while z < z1 - 0.5:
        slab(p, poly, z - 0.18, z + 0.18, mat, g=g)
        z += every


def accent_crown(p, poly, z, g=0.25):
    mass(p, grow(ccw(poly), g), [(z, 1), (z + 0.5, 1)], "Accent", top=False)


def landmark_glass(name, at, rng):
    root = empty(name, at)
    p = Part()
    poly = rect(13, 13)
    z = podium(p, poly)
    body = rect(12, 12)
    zt = floors(z, 12)
    mass(p, body, [(z, 1), (zt, 1)], "F_GlassBlue")
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((sx * 6.02, sy * 6.02, (z + zt) / 2), (0.3, 0.3, zt - z), "Accent")
    crown = rect(9, 9)
    zc = floors(zt, 2)
    mass(p, crown, [(zt, 1), (zc, 1)], "F_GlassBlue")
    accent_crown(p, body, zt - 0.1)
    parapet(p, crown, zc)
    roof_stuff(p, rng, 9, 9, zc + 0.7, n_ac=2, heli=True, bulk=False)
    p.build(name + "_Mesh", parent=root)
    return root


def landmark_round(name, at, rng):
    root = empty(name, at)
    p = Part()
    poly = ellipse(6.4, 6.4, 40)
    z = podium(p, poly)
    zt = floors(z, 13)
    mass(p, poly, [(z, 1), (zt, 1)], "F_GlassDark", smooth=True)
    bands(p, poly, z, zt, 3.2, g=0.18)
    accent_crown(p, poly, zt - 0.2, g=0.3)
    mass(p, ellipse(5.4, 5.4, 40), [(zt, 1), (zt + 2.4, 1)], "Band", smooth=True)
    roof_stuff(p, rng, 7, 7, zt + 2.4, n_ac=3, bulk=False)
    p.build(name + "_Mesh", parent=root)
    return root


def landmark_deco(name, at, rng):
    root = empty(name, at)
    p = Part()
    z = podium(p, rect(13, 13))
    t1 = floors(z, 8)
    mass(p, rect(13, 13), [(z, 1), (t1, 1)], "F_Stone")
    parapet(p, rect(13, 13), t1, h=0.9)
    t2 = floors(t1 + 0.9, 4)
    mass(p, rect(10, 10), [(t1 + 0.9, 1), (t2, 1)], "F_Stone")
    parapet(p, rect(10, 10), t2, h=0.9)
    t3 = floors(t2 + 0.9, 3)
    mass(p, rect(7, 7), [(t2 + 0.9, 1), (t3, 1)], "F_Stone")
    accent_crown(p, rect(7, 7), t3 - 0.6)
    p.cyl((0, 0, t3 + 3.5), 0.45, 7, "Cornice", seg=8, r2=0.05)
    roof_stuff(p, rng, 13, 13, t1 + 0.9, n_ac=2, bulk=False, green=True)
    p.build(name + "_Mesh", parent=root)
    return root


def landmark_spire(name, at, rng):
    root = empty(name, at)
    p = Part()
    poly = ellipse(6.4, 5.0, 36)
    z = podium(p, rect(13, 13))
    rings = [(z, 1.0)]
    h = 52
    for k in range(1, 13):
        t = k / 12
        s = 1.0 if t < 0.55 else math.cos((t - 0.55) / 0.45 * math.pi / 2) ** 0.8 * 0.95 + 0.05
        rings.append((z + h * t, s))
    mass(p, poly, rings, "F_GlassBlue", smooth=True, top=True)
    accent_crown(p, poly, z + 2)
    p.build(name + "_Mesh", parent=root)
    return root


def landmark_grid(name, at, rng):
    root = empty(name, at)
    p = Part()
    z = podium(p, rect(13, 13))
    zt = floors(z, 14)
    mass(p, rect(12.4, 12.4, 1.2, 3), [(z, 1), (zt, 1)], "F_GlassGreen")
    p.box((0, -6.25, zt - 1.6), (8, 0.15, 1.6), "Accent")
    parapet(p, rect(12.4, 12.4, 1.2, 3), zt, h=1.0, mat="Band")
    roof_stuff(p, rng, 12, 12, zt + 1.0, n_ac=4, skylight=True)
    p.build(name + "_Mesh", parent=root)
    return root


def mid_brick(name, at, rng, w=11, d=8, nfl=5, fac="F_Brick"):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d)
    z = podium(p, poly)
    zt = floors(z, nfl)
    mass(p, poly, [(z, 1), (zt, 1)], fac)
    slab(p, poly, zt, zt + 0.9, "Cornice", g=0.35)
    roof_stuff(p, rng, w, d, zt + 0.9, n_ac=2, tank=True, skylight=True)
    p.build(name + "_Mesh", parent=root)
    return root


def mid_white(name, at, rng, w=11, d=8, nfl=4):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d, 2.4, 5)
    z = 0.0
    mass(p, poly, [(0, 1), (3.6, 1)], "F_GlassDark", smooth=True, top=False)
    slab(p, poly, 3.6, 4.0, "Band", g=0.2)
    zt = floors(4.0, nfl)
    mass(p, poly, [(4.0, 1), (zt, 1)], "F_White", smooth=True)
    parapet(p, poly, zt, h=0.6, mat="Band", g=0.1)
    roof_stuff(p, rng, w - 2, d - 2, zt + 0.6, n_ac=3, pool=True)
    p.build(name + "_Mesh", parent=root)
    return root


def low_shops(name, at, rng, w=11, d=8):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d)
    z = podium(p, poly)
    zt = floors(z, 1)
    mass(p, poly, [(z, 1), (zt, 1)], "F_Salmon")
    slab(p, poly, zt, zt + 0.7, "Cornice", g=0.3)
    roof_stuff(p, rng, w, d, zt + 0.7, n_ac=2, skylight=True, green=True)
    for k in (-1, 1):
        p.box((k * w / 4, -d / 2 - 0.7, 3.4), (w / 2 - 0.6, 1.4, 0.12), "Awning")
    p.build(name + "_Mesh", parent=root)
    return root


def mid_stone(name, at, rng, w=11, d=8, nfl=6):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d)
    z = podium(p, poly)
    zt = floors(z, nfl)
    mass(p, poly, [(z, 1), (zt, 1)], "F_Stone")
    parapet(p, poly, zt, h=0.8, g=0.3)
    inner = rect(w - 3, d - 3)
    zt2 = floors(zt + 0.8, 1)
    mass(p, inner, [(zt + 0.8, 1), (zt2, 1)], "F_Stone")
    parapet(p, inner, zt2, h=0.5)
    roof_stuff(p, rng, w - 3, d - 3, zt2 + 0.5, n_ac=2, bulk=False)
    p.build(name + "_Mesh", parent=root)
    return root


def low_office(name, at, rng, w=11, d=8):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d)
    mass(p, poly, [(0, 1), (floors(0, 3), 1)], "F_Grid")
    zt = floors(0, 3)
    parapet(p, poly, zt, h=0.6, mat="Band")
    roof_stuff(p, rng, w, d, zt + 0.6, n_ac=2, pool=True)
    p.build(name + "_Mesh", parent=root)
    return root


def mid_curve(name, at, rng, w=11, d=8, nfl=5):
    root = empty(name, at)
    p = Part()
    poly = curved_end(w, d)
    z = podium(p, poly)
    zt = floors(z, nfl)
    mass(p, poly, [(z, 1), (zt, 1)], "F_GlassBlue", smooth=False)
    bands(p, poly, z, zt, 3.2, mat="Band", g=0.1)
    parapet(p, poly, zt, h=0.6, mat="Band")
    roof_stuff(p, rng, w - 4, d, zt + 0.6, n_ac=2)
    p.build(name + "_Mesh", parent=root)
    return root


def construction(name, at, rng, w=11, d=8, nfl=6):
    root = empty(name, at)
    p = Part()
    for k in range(nfl + 1):
        z = k * 3.2
        if k < nfl or True:
            pw = w if k < nfl - 1 else w * 0.6
            p.box((-(w - pw) / 2, 0, z + 0.15), (pw, d, 0.3), "Slab")
    for xi in range(4):
        for yi in range(3):
            x = -w / 2 + 0.3 + xi * (w - 0.6) / 3
            y = -d / 2 + 0.3 + yi * (d - 0.6) / 2
            top = nfl * 3.2 if x < w * 0.1 else (nfl - 1) * 3.2
            p.box((x, y, top / 2), (0.4, 0.4, top), "Slab")
    p.box((-w / 2 + 2, 0, 1.6), (3.0, d - 1, 3.2), "F_Cream")
    for sx in (-1, 1):
        p.box((0, sx * (d / 2 + 0.6), 1.0), (w + 1.2, 0.06, 2.0), "Fence")
        p.box((sx * (w / 2 + 0.6), 0, 1.0), (0.06, d + 1.2, 2.0), "Fence")
    mh = nfl * 3.2 + 14
    mx, my = w / 2 - 1.5, d / 2 - 1.5
    for dx in (-0.6, 0.6):
        for dy in (-0.6, 0.6):
            p.box((mx + dx, my + dy, mh / 2), (0.14, 0.14, mh), "Crane")
    for k in range(int(mh / 2.4)):
        p.box((mx, my - 0.6, 1.2 + k * 2.4), (1.2, 0.08, 0.08), "Crane")
        p.box((mx - 0.6, my, 1.2 + k * 2.4), (0.08, 1.2, 0.08), "Crane")
    p.box((mx - 9, my, mh + 0.6), (24, 1.0, 1.0), "Crane")
    p.box((mx + 5, my, mh + 0.6), (8, 1.0, 1.0), "Crane")
    p.box((mx + 8, my, mh - 0.4), (2.2, 1.6, 1.8), "Slab")
    p.box((mx + 1.4, my, mh - 0.6), (1.6, 1.6, 1.6), "Glass")
    p.cyl((mx, my, mh + 3), 0.06, 4.5, "Crane", seg=6)
    p.box((mx - 14, my, mh - 6), (0.04, 0.04, 12), "Trim")
    p.box((mx - 14, my, mh - 12.2), (0.6, 0.6, 0.5), "Trim")
    p.build(name + "_Mesh", parent=root)
    return root


def slim(name, at, rng, fac, nfl, w=6, d=12, shape="rect", tank=False):
    root = empty(name, at)
    p = Part()
    poly = rect(w, d) if shape == "rect" else chamfer(w, d, 1.2)
    z = podium(p, poly)
    zt = floors(z, nfl)
    mass(p, poly, [(z, 1), (zt, 1)], fac)
    parapet(p, poly, zt, h=0.7, mat="Cornice" if fac != "F_GlassGreen" else "Band")
    roof_stuff(p, rng, w, d, zt + 0.7, n_ac=2, tank=tank)
    p.build(name + "_Mesh", parent=root)
    return root


def sky(name, at, rng, kind):
    root = empty(name, at)
    p = Part()
    if kind == "slab":
        poly = rect(18, 12)
        z = podium(p, rect(20, 14))
        zt = floors(z, 21)
        mass(p, poly, [(z, 1), (zt, 1)], "F_GlassDark")
        parapet(p, poly, zt, h=1.2, mat="Band")
        roof_stuff(p, rng, 18, 12, zt + 1.2, n_ac=4)
    elif kind == "round":
        poly = ellipse(8, 8, 44)
        z = podium(p, ellipse(9, 9, 44))
        zt = floors(z, 18)
        mass(p, poly, [(z, 1), (zt, 1)], "F_GlassBlue", smooth=True)
        bands(p, poly, z, zt, 6.4, g=0.2)
        mass(p, ellipse(6.6, 6.6, 44), [(zt, 1), (zt + 3, 1)], "Band", smooth=True)
        roof_stuff(p, rng, 9, 9, zt + 3, n_ac=3, bulk=False)
    elif kind == "deco":
        z = podium(p, rect(16, 16))
        t = z
        for k, (s, n) in enumerate(((16, 10), (13, 6), (10, 4), (7, 2))):
            t2 = floors(t, n)
            mass(p, rect(s, s), [(t, 1), (t2, 1)], "F_Stone")
            parapet(p, rect(s, s), t2, h=0.8)
            t = t2 + 0.8
        p.cyl((0, 0, t + 5), 0.5, 10, "Cornice", seg=8, r2=0.04)
    elif kind == "spire":
        poly = ellipse(7.5, 5.8, 36)
        z = podium(p, rect(16, 13))
        rings = [(z, 1.0)]
        h = 78
        for k in range(1, 15):
            tt = k / 14
            s = 1.0 if tt < 0.6 else math.cos((tt - 0.6) / 0.4 * math.pi / 2) ** 0.8 * 0.95 + 0.05
            rings.append((z + h * tt, s))
        mass(p, poly, rings, "F_GlassBlue", smooth=True)
    elif kind == "grid":
        z = podium(p, rect(16, 14))
        zt = floors(z, 19)
        poly = rect(15, 13)
        mass(p, poly, [(z, 1), (zt, 1)], "F_GlassGreen")
        parapet(p, poly, zt, h=1.0, mat="Band")
        roof_stuff(p, rng, 15, 13, zt + 1, n_ac=5, skylight=True)
    elif kind == "twin":
        for dx in (-5.5, 5.5):
            poly = scaled(ellipse(5, 5, 36), 1, dx, 0)
            zt = floors(0, 16 if dx < 0 else 18)
            mass(p, poly, [(0, 1), (zt, 1)], "F_GlassBlue" if dx < 0 else "F_GlassDark", smooth=True)
            mass(p, scaled(ellipse(5.3, 5.3, 36), 1, dx, 0), [(zt, 1), (zt + 2, 1)], "F_Stone", smooth=True)
    elif kind == "cream":
        poly = rect(14, 12)
        z = podium(p, poly)
        zt = floors(z, 15)
        mass(p, poly, [(z, 1), (zt, 1)], "F_Cream")
        parapet(p, poly, zt, h=0.8)
        roof_stuff(p, rng, 14, 12, zt + 0.8, n_ac=3, tank=True)
    p.build(name + "_Mesh", parent=root)
    return root


def reset_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)


reset_scene()
kit_coll = bpy.data.collections.new(KIT)
bpy.context.scene.collection.children.link(kit_coll)
rng = random.Random(7)

roots = [make_car((0, -14, 0)), make_person((3.2, -14, 0)), make_lamp((5.5, -12.5, 0)), make_tree((-3.5, -12.5, 0), rng)]
row = [
    ("L_Glass", landmark_glass), ("L_Round", landmark_round), ("L_Deco", landmark_deco), ("L_Spire", landmark_spire), ("L_Grid", landmark_grid),
]
for i, (n, fn) in enumerate(row):
    roots.append(fn(n, (-40 + i * 18, 30, 0), rng))
backs = [
    ("B_Brick", lambda n, a: mid_brick(n, a, rng)),
    ("B_White", lambda n, a: mid_white(n, a, rng)),
    ("B_Shops", lambda n, a: low_shops(n, a, rng)),
    ("B_Stone", lambda n, a: mid_stone(n, a, rng)),
    ("B_Office", lambda n, a: low_office(n, a, rng)),
    ("B_Curve", lambda n, a: mid_curve(n, a, rng)),
    ("B_Build", lambda n, a: construction(n, a, rng)),
    ("B_Cream", lambda n, a: mid_brick(n, a, rng, nfl=6, fac="F_Cream")),
]
for i, (n, fn) in enumerate(backs):
    roots.append(fn(n, (-48 + i * 14, 6, 0)))
sides = [
    ("S_Resi", "F_Cream", 5, "rect", False),
    ("S_Glass", "F_GlassGreen", 8, "rect", False),
    ("S_Brick", "F_Brick", 3, "rect", True),
    ("S_Stone", "F_Stone", 7, "chamfer", False),
    ("S_Salmon", "F_Salmon", 4, "rect", True),
]
for i, (n, fac, nfl, shape, tank) in enumerate(sides):
    roots.append(slim(n, (-40 + i * 10, -6, 0), rng, fac, nfl, shape=shape, tank=tank))
for i, kind in enumerate(["slab", "round", "deco", "spire", "grid", "twin", "cream"]):
    roots.append(sky("K_" + kind.capitalize(), (-66 + i * 24, 62, 0), rng, kind))

stage = bpy.data.collections.new("Stage")
bpy.context.scene.collection.children.link(stage)
gm = bpy.data.meshes.new("Ground")
gbm = bmesh.new()
bmesh.ops.create_grid(gbm, x_segments=1, y_segments=1, size=160)
gbm.to_mesh(gm)
gbm.free()
gm.materials.append(material("GroundMat", "#1b1e25", 0, 0.9))
ground = bpy.data.objects.new("Ground", gm)
stage.objects.link(ground)
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 3.2
sun.data.color = srgb("#fff1dd")
sun.rotation_euler = (math.radians(48), math.radians(-18), math.radians(32))
stage.objects.link(sun)
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
cam.location = (8, -78, 52)
cam.data.lens = 30
stage.objects.link(cam)
tgt = Vector((0, 22, 10))
cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam
world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (*srgb("#2a2f3a"), 1)
    bg.inputs["Strength"].default_value = 1.4

os.makedirs(os.path.dirname(OUT), exist_ok=True)
for ob in bpy.data.objects:
    ob.select_set(False)
for ob in kit_coll.objects:
    ob.select_set(True)
bpy.context.view_layer.objects.active = roots[0]
opts = dict(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_lights=False, export_cameras=False, export_materials="EXPORT", export_image_format="JPEG")
try:
    bpy.ops.export_scene.gltf(export_jpeg_quality=82, **opts)
except TypeError:
    bpy.ops.export_scene.gltf(**opts)
for ob in kit_coll.objects:
    ob.select_set(False)
print("EXPORTED", OUT, os.path.getsize(OUT), len(roots))
