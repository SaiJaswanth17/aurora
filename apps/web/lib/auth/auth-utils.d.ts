export declare const validateEmail: (email: string) => boolean;
export declare const validatePassword: (password: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateUsername: (username: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const formatMessageTimestamp: (timestamp: string) => string;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const formatFileSize: (bytes: number) => string;
//# sourceMappingURL=auth-utils.d.ts.map