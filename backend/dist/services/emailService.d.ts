interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
interface DeadlineAlert {
    title: string;
    type: string;
    course?: string;
    endTime: Date;
    description?: string;
    urgencyLevel: 'urgent' | 'warning' | 'overdue';
}
declare class EmailService {
    private transporter;
    private isConfigured;
    constructor();
    initialize(): void;
    private initializeTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendDeadlineAlert(userEmail: string, userName: string, alerts: DeadlineAlert[]): Promise<boolean>;
    private generateSubject;
    private generateDeadlineEmailHTML;
    private formatDate;
    testConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=emailService.d.ts.map