// アップロード前にブラウザ側で画像を圧縮する。iPhone等のカメラ生データ(5000px超・
// 数MB)が無加工のままFirebase Storageに上がるのを防ぐため。kaiwai-native側の
// selectMedia(lib/flutter_flow/upload_data.dart)のデフォルト値(長辺1920px・品質82)と揃えている。
// GIFはアニメーションが壊れるため対象外(そのまま返す)。
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImageFile(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg" && file.size < 1024 * 1024) {
    // 既に十分小さいjpegは再エンコードの劣化を避けてそのまま使う
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
