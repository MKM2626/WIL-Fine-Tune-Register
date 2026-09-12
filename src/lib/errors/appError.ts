export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public status = 400
    ) {
        super(message);
        this.name = 'AppError';
    }
}

// throw new AppError(
//     'Fine tune cannot be deleted because it is finalised.',
//     'FINE_TUNE_FINALISED',
//     409
// );