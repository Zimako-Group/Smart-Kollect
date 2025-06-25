import { useAppDispatch, useAppSelector, type RootState } from '@/lib/redux/store';

// Custom hook to simplify Redux usage in components
export function useRedux() {
  const dispatch = useAppDispatch();
  const select = useAppSelector;

  return {
    dispatch,
    select,
    // Add selector helpers for common state slices
    dialer: {
      state: () => select((state: RootState) => state.dialer),
      isOpen: () => select((state: RootState) => state.dialer.isOpen),
      callState: () => select((state: RootState) => state.dialer.callState),
      callInfo: () => select((state: RootState) => state.dialer.callInfo),
    },
    accounts: {
      state: () => select((state: RootState) => state.accounts),
      allocatedAccounts: () => select((state: RootState) => state.accounts.allocatedAccounts),
      selectedAccount: () => select((state: RootState) => state.accounts.selectedAccount),
      metrics: () => select((state: RootState) => ({
        totalAccounts: state.accounts.totalAccounts,
        totalValue: state.accounts.totalValue,
        overdueAccounts: state.accounts.overdueAccounts,
        contactRate: state.accounts.contactRate,
      })),
    },
    user: {
      state: () => select((state: RootState) => state.user),
      isAuthenticated: () => select((state: RootState) => state.user.isAuthenticated),
      profile: () => select((state: RootState) => ({
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        role: state.user.role,
      })),
      performance: () => select((state: RootState) => state.user.performance),
    },
    reminders: {
      state: () => select((state: RootState) => state.reminders),
      all: () => select((state: RootState) => state.reminders.reminders),
      todayReminders: () => select((state: RootState) => ({
        total: state.reminders.todayReminders,
        completed: state.reminders.todayCompletedReminders,
        completionRate: state.reminders.todayReminders > 0 
          ? (state.reminders.todayCompletedReminders / state.reminders.todayReminders) * 100 
          : 0,
      })),
      metrics: () => select((state: RootState) => ({
        today: state.reminders.todayReminders,
        week: state.reminders.weekReminders,
        month: state.reminders.monthReminders,
        byType: state.reminders.remindersByType,
      })),
    },
    flags: {
      state: () => select((state: RootState) => state.flags),
      isDialogOpen: () => select((state: RootState) => state.flags.isDialogOpen),
      selectedAccount: () => select((state: RootState) => state.flags.selectedAccount),
      allFlags: () => select((state: RootState) => state.flags.flags),
      accountFlags: (accountId: string) => select((state: RootState) => 
        state.flags.flags.filter(flag => flag.accountId === accountId)
      ),
      metrics: () => select((state: RootState) => ({
        totalFlags: state.flags.totalFlags,
        highPriorityFlags: state.flags.highPriorityFlags,
        mediumPriorityFlags: state.flags.mediumPriorityFlags,
        lowPriorityFlags: state.flags.lowPriorityFlags,
      })),
      flagsByType: () => select((state: RootState) => state.flags.flagsByType),
      flagsByAge: () => select((state: RootState) => state.flags.flagsByAge),
      byPriority: () => select((state: RootState) => ({
        high: state.flags.flags.filter(flag => flag.priority === 'high'),
        medium: state.flags.flags.filter(flag => flag.priority === 'medium'),
        low: state.flags.flags.filter(flag => flag.priority === 'low')
      })),
    },
    email: {
      state: () => select((state: RootState) => state.email),
      isOpen: () => select((state: RootState) => state.email.isOpen),
      recipient: () => select((state: RootState) => ({
        email: state.email.recipientEmail,
        name: state.email.recipientName,
        accountNumber: state.email.accountNumber,
      })),
      content: () => select((state: RootState) => ({
        subject: state.email.subject,
        message: state.email.message,
        ccEmails: state.email.ccEmails,
        attachments: state.email.attachments,
      })),
      templates: () => select((state: RootState) => state.email.templates),
      showTemplates: () => select((state: RootState) => state.email.showTemplates),
      sending: () => select((state: RootState) => state.email.sending),
      sendStatus: () => select((state: RootState) => ({
        success: state.email.sendSuccess,
        error: state.email.error,
      })),
      history: () => select((state: RootState) => state.email.emailHistory),
    },
    sms: {
      state: () => select((state: RootState) => state.sms),
      isOpen: () => select((state: RootState) => state.sms.isOpen),
      recipient: () => select((state: RootState) => ({
        phone: state.sms.recipientPhone,
        name: state.sms.recipientName,
        accountNumber: state.sms.accountNumber,
      })),
      content: () => select((state: RootState) => ({
        message: state.sms.message,
        charactersLeft: state.sms.charactersLeft,
        isMessageTooLong: state.sms.isMessageTooLong
      })),
      templates: () => select((state: RootState) => state.sms.templates),
      selectedTemplate: () => select((state: RootState) => state.sms.selectedTemplate),
      sending: () => select((state: RootState) => state.sms.sending),
      sendStatus: () => select((state: RootState) => ({
        success: state.sms.sendSuccess,
        error: state.sms.error,
      })),
      history: () => select((state: RootState) => state.sms.smsHistory),
      error: () => select((state: RootState) => state.sms.error),
      historyLoading: () => select((state: RootState) => state.sms.historyLoading),
    },
    ptp: {
      state: () => select((state: RootState) => state.ptp),
      isOpen: () => select((state: RootState) => state.ptp.isOpen),
      customer: () => select((state: RootState) => ({
        id: state.ptp.customerId,
        name: state.ptp.customerName,
        accountNumber: state.ptp.accountNumber,
      })),
      formData: () => select((state: RootState) => ({
        amount: state.ptp.amount,
        date: state.ptp.date,
        paymentMethod: state.ptp.paymentMethod,
        notes: state.ptp.notes,
      })),
      creating: () => select((state: RootState) => state.ptp.creating),
      createStatus: () => select((state: RootState) => ({
        success: state.ptp.createSuccess,
        error: state.ptp.error,
      })),
      history: () => select((state: RootState) => state.ptp.ptpHistory),
      loadingHistory: () => select((state: RootState) => state.ptp.loadingHistory),
    },
    rtp: {
      state: () => select((state: RootState) => state.rtp),
      isOpen: () => select((state: RootState) => state.rtp.isOpen),
      customer: () => select((state: RootState) => state.rtp.customer),
      formData: () => select((state: RootState) => state.rtp.formData),
      creating: () => select((state: RootState) => state.rtp.creating),
      createStatus: () => select((state: RootState) => state.rtp.createStatus),
      history: () => select((state: RootState) => state.rtp.history),
      reasons: () => select((state: RootState) => state.rtp.reasons),
    },
    chat: {
      state: () => select((state: RootState) => state.chat),
      isDialogOpen: () => select((state: RootState) => state.chat.isDialogOpen),
      selectedAccount: () => select((state: RootState) => state.chat.selectedAccount),
      messages: () => select((state: RootState) => state.chat.messages),
      activeConversation: () => select((state: RootState) => state.chat.activeConversation),
    },
    notes: {
      state: () => select((state: RootState) => state.notes),
      isDialogOpen: () => select((state: RootState) => state.notes.isDialogOpen),
      selectedAccount: () => select((state: RootState) => state.notes.selectedAccount),
      notes: () => select((state: RootState) => state.notes.notes),
      activeCategory: () => select((state: RootState) => state.notes.activeCategory),
    },
    paymentHistory: {
      state: () => select((state: RootState) => state.paymentHistory),
      isOpen: () => select((state: RootState) => state.paymentHistory.isOpen),
      customerId: () => select((state: RootState) => state.paymentHistory.customerId),
      customerName: () => select((state: RootState) => state.paymentHistory.customerName),
      accountNumber: () => select((state: RootState) => state.paymentHistory.accountNumber),
    },
  };
}
