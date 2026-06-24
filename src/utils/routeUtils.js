function sendSuccess(res, result) {
  res.status(200).json({ success: true, result });
}

function sendError(res, error) {
  res.status(500).json({
    success: false,
    error: error && error.message ? error.message : String(error) || "Unknown error"
  });
}
function checkId(id) {
    if (!id || typeof id !== "string" || id.trim() === "") {
        return 0;
    }
    return id.split("_")[0];
}
function redirectTo(serverConfig, req){
    console.log(serverConfig,req.body,req.authorization);
    console.log(req);
    
    const url = `${serverConfig.host + ":" + serverConfig.port}${req.baseUrl}`;
    console.log("redirecting to " ,url);
    
    return { status: 302, headers: { Location: url , authorization: req.authorization }, body: req.body || {} };
}


module.exports = {
  sendSuccess,
  sendError,
  redirectTo,
  checkId
};

