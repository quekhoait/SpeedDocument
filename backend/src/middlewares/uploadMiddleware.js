import multer from 'multer';

const storage = multer.memoryStorage();


// =========================
// Upload document
// =========================
const documentUpload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error('Chỉ hỗ trợ file PDF, DOC, DOCX'));
    }
});



const avatarUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error('Avatar chỉ hỗ trợ JPG, JPEG, PNG, WEBP'));
    }
});


const uploadSingle = (fieldName = 'path') => {
    return documentUpload.single(fieldName);
};

const uploadAvatar = (fieldName = 'avatar') => {
    return avatarUpload.single(fieldName);
};


export {
    uploadSingle,
    uploadAvatar
};

export default uploadSingle;