from __future__ import annotations

import re
import zipfile
from pathlib import Path

from lxml import etree


SOURCE = Path("/Users/ansonhui/Desktop/Ramen_Style_Today_4x3_一般用語_圖像版.pptx")
OUTPUT = Path("/Users/ansonhui/Desktop/Ramen_Style_Today_16x9_字級調整版.pptx")

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}
EMU_PER_PX = 9525

SUMMARY_TEXTS = {
    "這不是單純的餐廳清單，而是先理解口味，再把結果轉成推薦與商業分析。",
    "一般使用者不用背拉麵流派，只要回答「今天想要的味道與口感」。",
    "設計原則：先分類料理形式，再比較口味細節。",
    "重點：店家資料不能反過來改變使用者的口味分類。",
    "公平分類 = 分流清楚 + 忌口優先 + 衝突修正 + 可驗證。",
    "使用者看到的是「為什麼像這一碗」，不是只有系統答案。",
    "商業價值來自「匿名需求訊號」，不是個人隱私。",
    "拉麵拆解建立理解，公平分類建立信任，結果掛接創造體驗，匿名分析創造商業價值。",
}


def q(name: str) -> str:
    prefix, local = name.split(":", 1)
    return f"{{{NS[prefix]}}}{local}"


def all_text(shape: etree._Element) -> str:
    return "".join(t.text or "" for t in shape.xpath(".//a:t", namespaces=NS)).strip()


def existing_sizes(shape: etree._Element) -> list[float]:
    values: list[float] = []
    for rpr in shape.xpath(".//a:rPr[@sz] | .//a:defRPr[@sz] | .//a:endParaRPr[@sz]", namespaces=NS):
        try:
            values.append(int(rpr.get("sz")) / 100)
        except (TypeError, ValueError):
            pass
    return values


def px_attr(elem: etree._Element | None, attr: str) -> float | None:
    if elem is None or elem.get(attr) is None:
        return None
    return int(elem.get(attr)) / EMU_PER_PX


def set_px_attr(elem: etree._Element | None, attr: str, value_px: float) -> None:
    if elem is not None:
        elem.set(attr, str(round(value_px * EMU_PER_PX)))


def shape_geometry(shape: etree._Element) -> tuple[float | None, float | None, float | None, float | None]:
    off = shape.find(".//a:xfrm/a:off", namespaces=NS)
    ext = shape.find(".//a:xfrm/a:ext", namespaces=NS)
    return px_attr(off, "x"), px_attr(off, "y"), px_attr(ext, "cx"), px_attr(ext, "cy")


def classify_font(text: str, sizes: list[float]) -> float | None:
    if not text:
        return None
    if text.startswith("資料依據"):
        return 6.4
    if text == "4:3":
        return 6.4
    if re.fullmatch(r"\d{2}", text) and any(abs(size - 9) < 0.2 for size in sizes):
        return 9
    if re.match(r"^[一二三四五六七八九十]、", text):
        return 16
    if text == "Ramen Style Today" or any(abs(size - 28) < 0.2 for size in sizes):
        return 40
    if any(abs(size - 13.5) < 0.2 for size in sizes):
        return 20
    if text in SUMMARY_TEXTS:
        return 20
    if text == "總結":
        return 16
    if any(abs(size - 12.2) < 0.3 or abs(size - 11.5) < 0.3 or abs(size - 12.4) < 0.3 or abs(size - 12.8) < 0.3 for size in sizes):
        return 16
    if any(abs(size - 9.8) < 0.3 for size in sizes):
        return 14
    if any(abs(size - 10.2) < 0.3 for size in sizes):
        return 14 if re.fullmatch(r"\d+", text) else 16
    if any(abs(size - 16) < 0.3 for size in sizes):
        return 14
    if any(abs(size - 14) < 0.3 for size in sizes):
        return 20
    return None


def min_height_px(font_size: float, text: str) -> float:
    if font_size >= 40:
        return 104
    if font_size >= 20:
        return 56 if len(text) <= 34 else 82
    if font_size >= 16:
        return 34
    if font_size >= 14:
        return 34 if len(text) <= 32 else 48
    return 18


def min_width_px(font_size: float, text: str, current_width: float | None) -> float | None:
    if current_width is None:
        return None
    if font_size >= 40:
        return max(current_width, 650)
    if font_size >= 20:
        return max(current_width, 520)
    if font_size >= 16:
        return max(current_width, 260)
    if font_size >= 14:
        return max(current_width, 360)
    return current_width


def ensure_run_properties(shape: etree._Element, font_size: float) -> None:
    size_value = str(round(font_size * 100))
    for run in shape.xpath(".//a:r", namespaces=NS):
        rpr = run.find("a:rPr", namespaces=NS)
        text = run.find("a:t", namespaces=NS)
        if rpr is None:
            rpr = etree.Element(q("a:rPr"))
            run.insert(0, rpr)
        rpr.set("sz", size_value)
    for rpr in shape.xpath(".//a:defRPr | .//a:endParaRPr", namespaces=NS):
        rpr.set("sz", size_value)


def normalize_autofit(shape: etree._Element) -> None:
    for body_pr in shape.xpath(".//a:bodyPr", namespaces=NS):
        for child in list(body_pr):
            if child.tag in {q("a:normAutofit"), q("a:spAutoFit")}:
                body_pr.remove(child)
        if body_pr.find("a:noAutofit", namespaces=NS) is None:
            body_pr.append(etree.Element(q("a:noAutofit")))


def adjust_text_box(shape: etree._Element, font_size: float, text: str) -> None:
    off = shape.find(".//a:xfrm/a:off", namespaces=NS)
    ext = shape.find(".//a:xfrm/a:ext", namespaces=NS)
    if ext is None:
        return

    x, y, width, height = shape_geometry(shape)
    if height is not None:
        set_px_attr(ext, "cy", max(height, min_height_px(font_size, text)))
    width_target = min_width_px(font_size, text, width)
    if width_target is not None and x is not None:
        right_limit = 1100 if font_size >= 16 else 1080
        width_target = min(width_target, max(width or 0, right_limit - x))
        set_px_attr(ext, "cx", width_target)

    if off is not None and font_size >= 40:
        set_px_attr(off, "x", 105)
        set_px_attr(off, "y", 58)
        set_px_attr(ext, "cx", 930)
        set_px_attr(ext, "cy", 70)
    elif off is not None and font_size == 20 and text not in SUMMARY_TEXTS:
        set_px_attr(off, "x", 110)
        set_px_attr(off, "y", 124)
        set_px_attr(ext, "cx", 650)
        set_px_attr(ext, "cy", 66)
    elif text in SUMMARY_TEXTS:
        set_px_attr(ext, "cy", max(px_attr(ext, "cy") or 0, 76))
        if x is not None and width is not None:
            set_px_attr(ext, "cx", min(max(width, 520), max(width, 1080 - x)))
        if off is not None and x is not None and x > 600:
            set_px_attr(off, "x", 665)
            set_px_attr(off, "y", 505)
            set_px_attr(ext, "cx", 430)
            set_px_attr(ext, "cy", 104)


def enlarge_support_cards(root: etree._Element) -> None:
    for shape in root.xpath(".//p:sp", namespaces=NS):
        if all_text(shape):
            continue
        off = shape.find(".//a:xfrm/a:off", namespaces=NS)
        ext = shape.find(".//a:xfrm/a:ext", namespaces=NS)
        x = px_attr(off, "x")
        y = px_attr(off, "y")
        width = px_attr(ext, "cx")
        height = px_attr(ext, "cy")
        if x is not None and y is not None and width is not None and height is not None:
            if x > 600 and y > 450 and 60 <= height <= 100 and width < 450:
                set_px_attr(off, "x", 650)
                set_px_attr(off, "y", 494)
                set_px_attr(ext, "cx", 460)
                set_px_attr(ext, "cy", 112)
                continue
        if height is not None and 60 <= height < 84:
            set_px_attr(ext, "cy", 84)


def move_body_closer_to_heading(shape: etree._Element, previous_heading: etree._Element | None) -> None:
    if previous_heading is None:
        return
    off = shape.find(".//a:xfrm/a:off", namespaces=NS)
    ext = shape.find(".//a:xfrm/a:ext", namespaces=NS)
    if off is None or ext is None:
        return
    x, y, _width, _height = shape_geometry(shape)
    heading_x, heading_y, _heading_width, _heading_height = shape_geometry(previous_heading)
    if x is None or y is None or heading_x is None or heading_y is None:
        return
    if abs(x - heading_x) <= 90 and 18 <= y - heading_y <= 44:
        set_px_attr(off, "y", heading_y + 26)
        set_px_attr(ext, "cy", max(px_attr(ext, "cy") or 0, 40))


def move_right_images_for_long_titles(root: etree._Element) -> None:
    main_title = ""
    for shape in root.xpath(".//p:sp", namespaces=NS):
        text = all_text(shape)
        sizes = existing_sizes(shape)
        if text and any(abs(size - 40) < 0.2 for size in sizes) and text != "Ramen Style Today":
            main_title = text
            break
    if not main_title:
        return
    title_len = len(main_title)
    target_y = 150 if title_len >= 18 else 125 if title_len >= 15 else None
    if target_y is None:
        return
    for pic in root.xpath(".//p:pic", namespaces=NS):
        off = pic.find(".//a:xfrm/a:off", namespaces=NS)
        x = px_attr(off, "x")
        y = px_attr(off, "y")
        if x is not None and y is not None and x > 600 and y < target_y:
            set_px_attr(off, "y", target_y)


def replace_ratio_text(shape: etree._Element) -> None:
    for node in shape.xpath(".//a:t", namespaces=NS):
        if (node.text or "").strip() == "4:3":
            node.text = "16:9"


def update_presentation_xml(xml: bytes) -> bytes:
    root = etree.fromstring(xml)
    slide_size = root.find(".//p:sldSz", namespaces=NS)
    if slide_size is not None:
        slide_size.set("cx", "12192000")
        slide_size.set("cy", "6858000")
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def update_slide_xml(xml: bytes) -> bytes:
    root = etree.fromstring(xml)
    enlarge_support_cards(root)
    previous_heading: etree._Element | None = None
    for shape in root.xpath(".//p:sp", namespaces=NS):
        text = all_text(shape)
        if not text:
            continue
        sizes = existing_sizes(shape)
        font_size = classify_font(text, sizes)
        replace_ratio_text(shape)
        if font_size is None:
            continue
        ensure_run_properties(shape, font_size)
        if not text.startswith("資料依據") and text != "4:3" and not re.fullmatch(r"\d{2}", text):
            normalize_autofit(shape)
            if font_size == 14:
                move_body_closer_to_heading(shape, previous_heading)
            adjust_text_box(shape, font_size, text)
        if font_size == 16 and not re.match(r"^[一二三四五六七八九十]、", text):
            previous_heading = shape
        elif font_size not in {14, 16}:
            previous_heading = None
    move_right_images_for_long_titles(root)
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def main() -> None:
    OUTPUT.unlink(missing_ok=True)
    with zipfile.ZipFile(SOURCE, "r") as zin, zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "ppt/presentation.xml":
                data = update_presentation_xml(data)
            elif re.fullmatch(r"ppt/slides/slide\d+\.xml", item.filename):
                data = update_slide_xml(data)
            zout.writestr(item, data)
    print(OUTPUT)


if __name__ == "__main__":
    main()
