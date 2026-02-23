export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.fail(400, "file is required");
    }
    return res.success(200, "upload file successfully", req.file.filename);
  } catch (error) {
    console.log("UploadMedia API Error:", error);
    return res.fail(500, "Internal server error");
  }
};
