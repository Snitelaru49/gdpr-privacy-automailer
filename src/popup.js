document.addEventListener('DOMContentLoaded', function() {
  const userEmailInput = document.getElementById('userEmail');
  const findEmailBtn = document.getElementById('findEmailBtn');
  const statusDiv = document.getElementById('status');
const addCustomEmailBtn = document.getElementById('addCustomEmailBtn');
const removeCustomEmailBtn = document.getElementById('removeCustomEmailBtn');
const customEmailInput = document.getElementById('customEmail');
const suggestGlobal = document.getElementById('suggestGlobal');
const dbSearchBtn = document.getElementById('dbSearchBtn');
//settings
const settingsBtn = document.getElementById('settingsBtn');
  chrome.storage.local.get(['userEmail'], function(result) {
    if (result.userEmail) {
      userEmailInput.value = result.userEmail;
    }
  });
  chrome.storage.local.get(['customEmails'], console.log);
  userEmailInput.addEventListener('input', function() {
    chrome.storage.local.set({ userEmail: userEmailInput.value });
  });
// Find privacy emails on the current page
findEmailBtn.addEventListener('click', async function() {
  const userEmail = userEmailInput.value;
  const emailListDiv = document.getElementById('emailList');
  emailListDiv.innerHTML = '';
  if (!userEmail || !isValidEmail(userEmail)) {
    showStatus('Please enter a valid email address', 'error');
    return;
  }
  showStatus('Searching for privacy emails...', 'loading');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'findEmails' }, function(response) {
      const emails = response && response.emails ? response.emails : [];
      if (emails.length === 0) {
        showStatus('No privacy-related emails found on this page', 'error');
        return;
      }
      showStatus(`Found ${emails.length} email(s):`, 'success');
      const ul = document.createElement('ul');
      // Fetch personal DB for comparison
      chrome.storage.local.get(['customEmails'], function(result) {
        const customEmails = result.customEmails || {};
        emails.forEach(email => {
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.alignItems = 'center';
          li.style.justifyContent = 'center';
          li.style.gap = '10px';

          const emailSpan = document.createElement('span');
          emailSpan.style.cursor = 'pointer';
          emailSpan.style.color = '#4285f4';
          emailSpan.textContent = email;
          li.appendChild(emailSpan);

          // Check if email is in knownEmails or customEmails
          const isInGlobal = Object.values(knownEmails).includes(email);
          const isInPersonal = Object.values(customEmails).includes(email);

          if (!isInGlobal && !isInPersonal) {
            // Add a button to save to personal DB
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add to My Emails';
            addBtn.className = 'btn btn-green';
            addBtn.onclick = function(e) {
              e.stopPropagation();
              // Save to personal DB for this domain
              const domain = new URL(tab.url).hostname.replace(/^www\./, '');
              chrome.storage.local.get(['customEmails'], function(res) {
                const customEmails = res.customEmails || {};
                customEmails[domain] = email;
                chrome.storage.local.set({ customEmails }, function() {
                  showStatus('Email added to your personal database.', 'success');
                });
              });

              // Suggest for global DB if checked
              if (suggestGlobal && suggestGlobal.checked) {
                showStatus('Opening suggestion form...', 'loading');
                const suggestionUrl = `https://github.com/Snitelaru49/gdpr-privacy-automailer/issues/new?title=Suggest+privacy+email+for+${domain}&body=${encodeURIComponent(email)}`;
                setTimeout(() => {
                  window.open(suggestionUrl, '_blank');
                  showStatus('Suggestion form opened.', 'info');
                }, 500);
              }
            };
            li.appendChild(addBtn);
          }

          li.onclick = function() {
            const subject = 'GDPR Data Deletion Request - Article 17';
            const bodyPromise = generateGDPRTemplate(userEmail, tab.url);
            bodyPromise.then(body => {
              const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              window.open(mailtoLink);
            });
          };
          ul.appendChild(li);
        });
        emailListDiv.appendChild(ul);
      });
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});
//google search for privacy emails
const googleSearchBtn = document.getElementById('googleSearchBtn');
googleSearchBtn.addEventListener('click', async function() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname.replace(/^www\./, '');
  const query = `site:${domain} (email OR contact OR privacy)`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(googleUrl, '_blank');
});
let knownEmails = {};
fetch('src/emails.json')
  .then(response => response.json())
  .then(data => { knownEmails = data; });

settingsBtn.addEventListener('click', function() {
  chrome.storage.local.get(['customEmails'], function(result) {
    const customEmails = result.customEmails || {};
    if (Object.keys(customEmails).length === 0) {
      alert('No personal emails saved.');
    } else {
      let msg = 'Your personal privacy emails:\n\n';
      for (const [domain, email] of Object.entries(customEmails)) {
        msg += `${domain}: ${email}\n`;
      }
      alert(msg);
    }
  });
});
//db search 
dbSearchBtn.addEventListener('click', async function() {
  const userEmail = userEmailInput.value;
  const emailListDiv = document.getElementById('emailList');
  emailListDiv.innerHTML = '';
  if (!userEmail || !isValidEmail(userEmail)) {
    showStatus('Please enter a valid email address', 'error');
    return;
  }
  showStatus('Searching database...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname.replace(/^www\./, '');

  chrome.storage.local.get(['customEmails'], function(result) {
    const customEmails = result.customEmails || {};
    const personalEmail = customEmails[domain];
    // Support for knownEmails as object or as country->domain mapping
    let dbEmails = [];
    if (knownEmails[domain]) {
      dbEmails.push(knownEmails[domain]);
    } else {
      // If knownEmails is a country->domain mapping
      for (const country in knownEmails) {
        if (knownEmails[country] && knownEmails[country][domain]) {
          dbEmails.push(knownEmails[country][domain]);
        }
      }
    }
    // Remove duplicates and personal email if already in dbEmails
    dbEmails = dbEmails.filter(e => e && e !== personalEmail);

    if (!personalEmail && dbEmails.length === 0) {
      showStatus('No privacy email found in personal or global database for this site.', 'error');
      return;
    }

    showStatus('Privacy emails found for this site:', 'success');
    const ul = document.createElement('ul');
    if (personalEmail) {
      const li = document.createElement('li');
      li.style.cursor = 'pointer';
      li.style.color = '#34a853'; // green for personal
      li.textContent = personalEmail + ' (personal)';
      li.onclick = function() {
        const subject = 'GDPR Data Deletion Request - Article 17';
        const body = generateGDPRTemplate(userEmail, tab.url);
        const mailtoLink = `mailto:${personalEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
      };
      ul.appendChild(li);
    }
    dbEmails.forEach(email => {
      const li = document.createElement('li');
      li.style.cursor = 'pointer';
      li.style.color = '#fbbc05'; // yellow for global
      li.textContent = email + ' (database)';
      li.onclick = function() {
        const subject = 'GDPR Data Deletion Request - Article 17';
        const body = generateGDPRTemplate(userEmail, tab.url);
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
      };
      ul.appendChild(li);
    });
    emailListDiv.appendChild(ul);
  });
});
// Add custom email functionality
addCustomEmailBtn.addEventListener('click', async function() {
  const customEmail = customEmailInput.value.trim();
  if (!isValidEmail(customEmail)) {
    showStatus('Invalid email address.', 'error');
    return;
  }
  showStatus('Saving...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname.replace(/^www\./, '');

  // Save to personal DB
  chrome.storage.local.get(['customEmails'], function(result) {
    const customEmails = result.customEmails || {};
    customEmails[domain] = customEmail;
    chrome.storage.local.set({ customEmails }, function() {
      showStatus('Email saved for this domain.', 'success');
    });
  });

  // Suggest for global DB
  if (suggestGlobal.checked) {
    showStatus('Opening suggestion form...', 'loading');
    const suggestionUrl = `https://github.com/Snitelaru49/gdpr-privacy-automailer/issues/new?title=Suggest+privacy+email+for+${domain}&body=${encodeURIComponent(customEmail)}`;
    setTimeout(() => {
      window.open(suggestionUrl, '_blank');
      showStatus('Suggestion form opened.', 'info');
    }, 500);
  }
});
// Remove custom email functionality
removeCustomEmailBtn.addEventListener('click', async function() {
  showStatus('Removing...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname.replace(/^www\./, '');
  chrome.storage.local.get(['customEmails'], function(result) {
    const customEmails = result.customEmails || {};
    if (customEmails[domain]) {
      delete customEmails[domain];
      chrome.storage.local.set({ customEmails }, function() {
        showStatus('Custom email removed for this domain.', 'success');
      });
    } else {
      showStatus('No custom email to remove for this domain.', 'error');
    }
  });
});

// When searching for an email, check personal DB first
async function getEmailForDomain(domain) {
  return new Promise(resolve => {
    chrome.storage.local.get(['customEmails'], function(result) {
      const customEmails = result.customEmails || {};
      resolve(customEmails[domain] || knownEmails[domain]);
    });
  });
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  if (type === 'loading') {
    statusDiv.innerHTML = `<span class="spinner"></span> <span style="vertical-align:middle;">${message}</span>`;
  } else {
    statusDiv.textContent = message;
  }
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
const templateModal = document.getElementById('templateModal');
const templateTextarea = document.getElementById('templateTextarea');
const saveTemplateBtn = document.getElementById('saveTemplateBtn');
const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');

editTemplateBtn.addEventListener('click', function() {
  chrome.storage.local.get(['gdprTemplate'], function(result) {
    const currentTemplate = result.gdprTemplate || 
`Subject: GDPR Data Deletion Request - Article 17

Dear Data Protection Officer,

I am writing to formally request the deletion of my personal data under Article 17 (Right to erasure) of the General Data Protection Regulation (GDPR).

Personal Details:
- Email: {{email}}
- Website: {{domain}}
- Date of Request: {{date}}

I request that you:
1. Delete all personal data you hold about me
2. Confirm in writing that this has been done
3. Inform any third parties with whom you have shared my data

I expect a response within 30 days as required by GDPR Article 12.

If you need additional information to locate my records, please contact me at this email address.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
`;
    templateTextarea.value = currentTemplate;
    templateModal.style.display = 'flex';
  });
});

saveTemplateBtn.addEventListener('click', function() {
  const newTemplate = templateTextarea.value;
  chrome.storage.local.set({ gdprTemplate: newTemplate }, function() {
    showStatus('Template updated!', 'success');
    templateModal.style.display = 'none';
  });
});

cancelTemplateBtn.addEventListener('click', function() {
  templateModal.style.display = 'none';
});

async function generateGDPRTemplate(userEmail, siteUrl) {
  const domain = new URL(siteUrl).hostname;
  const date = new Date().toLocaleDateString();
  let template = `Subject: GDPR Data Deletion Request - Article 17

Dear Data Protection Officer,

I am writing to formally request the deletion of my personal data under Article 17 (Right to erasure) of the General Data Protection Regulation (GDPR).

Personal Details:
- Email: {{email}}
- Website: {{domain}}
- Date of Request: {{date}}

I request that you:
1. Delete all personal data you hold about me
2. Confirm in writing that this has been done
3. Inform any third parties with whom you have shared my data

I expect a response within 30 days as required by GDPR Article 12.

If you need additional information to locate my records, please contact me at this email address.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
`;

  // Always try to get the custom template from storage
  return new Promise(resolve => {
    chrome.storage.local.get(['gdprTemplate'], function(result) {
      if (result.gdprTemplate) {
        template = result.gdprTemplate;
      }
      // Replace placeholders
      resolve(
        template
          .replace(/{{email}}/g, userEmail)
          .replace(/{{domain}}/g, domain)
          .replace(/{{date}}/g, date)
      );
    });
  });
}
// Content script to find privacy-related emails on the current page
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
});