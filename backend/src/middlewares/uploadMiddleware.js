import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Chỉ hỗ trợ file PDF, DOC, DOCX'));
    },
});

const uploadSingle = (fieldName = 'path') => upload.single(fieldName);

export { uploadSingle };
export default uploadSingle;