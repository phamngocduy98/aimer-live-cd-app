export function fail(res: any, message: string, code?: number) {
  if (!!code) res.statusCode = code;
  res.send({
    status: "error",
    message: message
  });
  res.end();
  console.log(`[ ${"Response: Fail".padStart(15)} ] ${message}`);
}
export function ok(res: any, message: string = "OK") {
  res.send({
    status: "success",
    message
  });
  res.end();
}
