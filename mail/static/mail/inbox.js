document.addEventListener('DOMContentLoaded', function() {
    
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  load_mailbox('inbox');

  document.querySelector('#compose-form').onsubmit = function(event) {
      event.preventDefault();

      const recipients = document.querySelector('#compose-recipients').value;
      const subject = document.querySelector('#compose-subject').value;
      const body = document.querySelector('#compose-body').value;

      fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
              recipients: recipients,
              subject: subject,
              body: body
          })
      })
      .then(response => response.json())
      .then(result => {
          load_mailbox('sent');
      });
  };
});

function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
          const email_div = document.createElement('div');
          email_div.classList.add('email');
          email_div.innerHTML = `
              <strong>${email.sender}</strong>
              <span>${email.subject}</span>
              <span>${email.timestamp}</span>
          `;

          email_div.className = email.read ? 'read' : 'unread';
          

          email_div.addEventListener('click', () => view_email(email.id));

          document.querySelector('#emails-view').append(email_div);
      });
  });
}



function view_email(email_id) {
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  document.querySelector('#emails-view').innerHTML = '';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      const email_div = document.createElement('div');
      email_div.innerHTML = `
          <h3>${email.subject}</h3>
          <p><strong>From:</strong> ${email.sender}</p>
          <p><strong>To:</strong> ${email.recipients}</p>
          <p><strong>Time:</strong> ${email.timestamp}</p>
          <hr>
          <p>${email.body}</p>
      `;

      document.querySelector('#emails-view').append(email_div);

      if (!email.read) {
          fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({ read: true })
          });
      }

      if (email.recipients.includes(document.querySelector('h2').innerText)) {
          const archive_button = document.createElement('button');
          archive_button.className = 'buttom';
          archive_button.innerHTML = email.archived ? 'Unarchive' : 'Archive';
          archive_button.addEventListener('click', () => {
              fetch(`/emails/${email_id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ archived: !email.archived })
              })
              .then(() => load_mailbox('inbox'));
          });
          document.querySelector('#emails-view').append(archive_button);
      }

      const reply_button = document.createElement('button');
      reply_button.innerHTML = 'Reply';
      reply_button.className = 'buttom'
      reply_button.addEventListener('click', () => {
          compose_email();
          document.querySelector('#compose-recipients').value = email.sender;
          document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
          document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector('#emails-view').append(reply_button);
  });
}

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}