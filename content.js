console.log('GDPR Auto Mailer: Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findEmails') {
    const emails = findPrivacyEmails();
    sendResponse({ emails: emails });
  }
});

function findPrivacyEmails() {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const privacyKeywords = ['privacy', 'dpo', 'contact', 'support', 'legal', 'data-protection'];
  const pageText = document.body.innerText || document.body.textContent || '';
  const allEmails = pageText.match(emailRegex) || [];
  const privacyEmails = allEmails.filter(email => {
    const localPart = email.split('@')[0].toLowerCase();
    return privacyKeywords.some(keyword => localPart.includes(keyword));
  });
  return [...new Set(privacyEmails)];
}