export const welcome = () => {
     const date = new Date(Date.now());
     const hours = date.getHours();
     let greeting = '';

     // Time-based greeting
     if (hours < 12) {
          greeting = 'Good morning! 🌞 Let’s get the day started!';
     } else if (hours < 18) {
          greeting = 'Good afternoon! 🌤️ Keep the momentum going!';
     } else {
          greeting = 'Good evening! 🌙 Hope you had a fantastic day!';
     }

     return `
      <div style="border:1px solid black; text-align:center; font-family: 'Verdana', sans-serif; color:#4CAF50; padding: 50px 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); max-width: 100%; margin: 200px 200px; animation: fadeIn 2s;">
        <h1 style="font-size: 48px; color: #FF6347; animation: scaleUp 1s ease-in-out;">Kaj BD</h1>
        <p style="font-size: 24px; color: #2F4F4F; animation: slideIn 1.5s ease-in-out;">${greeting}</p>
        <p style="font-size: 24px; color: #2F4F4F; animation: slideIn 1.5s ease-in-out;">Payment Successful.
        Thank You.</p>

        You may now close this browser and return to the kaaj bd app to continue.
      </div>
  
      <style>
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
  
        @keyframes scaleUp {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }
  
        @keyframes slideIn {
          from {
            transform: translateX(-50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
};
