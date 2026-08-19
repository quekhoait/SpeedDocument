import multer from 'multer';

const storage = multer.memoryStorage();

// =========================
// Upload Audio (Speech-to-text / Audio Processing)
// =========================
const audioUpload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'audio/mpeg',       // .mp3
            'audio/mp3',
            'audio/wav',        // .wav
            'audio/x-wav',
            'audio/wave',
            'audio/m4a',        // .m4a
            'audio/x-m4a',
            'audio/mp4',
            'audio/aac',        // .aac
            'audio/ogg',        // .ogg
            'audio/webm'        // .webm
        ];

        // Hoặc kiểm tra nhanh mimeType bắt đầu bằng 'audio/'
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
            return;
        }

        cb(new Error('Chỉ hỗ trợ file âm thanh (MP3, WAV, M4A, AAC, OGG, WEBM)'));
    }
});

// =========================
// Upload Document
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

// =========================
// Upload Avatar
// =========================
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

// Helper functions gắn vào route
const uploadSingle = (fieldName = 'path') => documentUpload.single(fieldName);
const uploadAvatar = (fieldName = 'avatar') => avatarUpload.single(fieldName);
const uploadAudio = (fieldName = 'file') => audioUpload.single(fieldName);

export {
    uploadSingle,
    uploadAvatar,
    uploadAudio
};

export default uploadSingle;