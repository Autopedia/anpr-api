const fs = require("fs");
const path = require("path");

const ffi = require("ffi-napi");
const jpeg = require("jpeg-js");

function getLibPath() {
  const os_name = process.platform;
  const arch_name = process.arch;
  console.log(`os_name=${os_name}, arch_name=${arch_name}`);

  return path.resolve(path.join(__dirname, "bin", "libtsanpr.so"));
}

const lib = ffi.Library(getLibPath(), {
  /*
  const char* WINAPI anpr_initialize(const char* mode); // [IN] 라이브러리 동작 방식 설정
  */
  anpr_initialize: ["string", ["string"]],
  /*
  const char* WINAPI anpr_read_file(
    const char* imgFileName,      // [IN] 입력 이미지 파일명
    const char* outputFormat,     // [IN] 출력 데이터 형식
    const char* options);         // [IN] 기능 옵션
  */
  anpr_read_file: ["string", ["string", "string", "string"]],
  /*
  const char* WINAPI anpr_read_pixels(
    const unsigned char* pixels,  // [IN] 이미지 픽셀 시작 주소
    const unsigned long width,    // [IN] 이미지 가로 픽셀 수
    const unsigned long height,   // [IN] 이미지 세로 픽셀 수
    const unsigned long stride,   // [IN] 이미지 한 라인의 바이트 수
    const char* pixelFormat,      // [IN] 이미지 픽셀 형식 
    const char* outputFormat,     // [IN] 출력 데이터 형식
    const char* options);         // [IN] 기능 옵션
  */
  anpr_read_pixels: [
    "string",
    ["pointer", "int32", "int32", "int32", "string", "string", "string"],
  ],
});

function readFile(imgFile, outputFormat, options) {
  process.stdout.write(
    `${imgFile} (outFormat="${outputFormat}", options="${options}") => `,
  );

  // 이미지 파일명 입력으로 차번 인식
  let result = lib.anpr_read_file(imgFile, outputFormat, options);
  console.log(result);
}

function readPixels(imgFile, outputFormat, options) {
  process.stdout.write(
    `${imgFile} (outFormat="${outputFormat}", options="${options}") => `,
  );

  // 이미지 파일을 메모리에 로딩
  let jpegData = fs.readFileSync(imgFile);
  let img = jpeg.decode(jpegData, {
    formatAsRGBA: false,
  });

  // 픽셀 버퍼 입력으로 차번 인식
  let result = lib.anpr_read_pixels(
    img.data,
    img.width,
    img.height,
    0,
    "BGR",
    outputFormat,
    options,
  );
  console.log(result);
}

(function () {
  const error = lib.anpr_initialize("json");
  if (error) {
    console.error(error);
    return -2;
  }

  readFile(path.join("./img", "sample.jpg"), "text", "");
  readFile(path.join("./img", "img031.jpg"), "text", "");
  readPixels(path.join("./img", "sample.jpg"), "text", "");
  readPixels(path.join("./img", "img031.jpg"), "text", "");

  readFile(path.join("./img", "sample.jpg"), "json", "");
  readFile(path.join("./img", "img031.jpg"), "json", "");
  readPixels(path.join("./img", "sample.jpg"), "json", "");
  readPixels(path.join("./img", "img031.jpg"), "json", "");

  readFile(path.join("./img", "sample.jpg"), "yaml", "");
  readFile(path.join("./img", "img031.jpg"), "yaml", "");
  readPixels(path.join("./img", "sample.jpg"), "yaml", "");
  readPixels(path.join("./img", "img031.jpg"), "yaml", "");

  readFile(path.join("./img", "sample.jpg"), "xml", "");
  readFile(path.join("./img", "img031.jpg"), "xml", "");
  readPixels(path.join("./img", "sample.jpg"), "xml", "");
  readPixels(path.join("./img", "img031.jpg"), "xml", "");
})();
