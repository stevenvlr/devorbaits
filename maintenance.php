<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site en Maintenance - DevoRbaits</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .maintenance-container {
            text-align: center;
            max-width: 700px;
            padding: 40px;
            background: rgba(26, 26, 26, 0.8);
            border: 2px solid rgba(234, 179, 8, 0.3);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .maintenance-icon {
            font-size: 80px;
            margin-bottom: 30px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        h1 {
            font-size: 42px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #eab308;
            text-shadow: 0 0 20px rgba(234, 179, 8, 0.5);
        }
        
        .subtitle {
            font-size: 20px;
            color: #9e9e9e;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .message {
            font-size: 16px;
            color: #ffffff;
            line-height: 1.8;
            margin-bottom: 40px;
            padding: 20px;
            background: rgba(234, 179, 8, 0.1);
            border-left: 4px solid #eab308;
            border-radius: 8px;
        }
        
        .countdown {
            margin-top: 30px;
            margin-bottom: 30px;
            padding: 30px;
            background: rgba(234, 179, 8, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(234, 179, 8, 0.3);
        }
        
        .countdown p {
            font-size: 18px;
            color: #9e9e9e;
            margin-bottom: 20px;
        }
        
        #countdown-timer {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .time-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 80px;
        }
        
        .time-unit span {
            font-size: 48px;
            font-weight: bold;
            color: #eab308;
            text-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
            line-height: 1;
        }
        
        .time-unit small {
            font-size: 12px;
            color: #9e9e9e;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .time-separator {
            font-size: 36px;
            font-weight: bold;
            color: #eab308;
            margin: 0 5px;
        }
        
        .contact-info {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(234, 179, 8, 0.2);
        }
        
        .contact-info p {
            color: #9e9e9e;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .contact-info a {
            color: #eab308;
            text-decoration: none;
            font-weight: bold;
        }
        
        .contact-info a:hover {
            color: #facc15;
            text-decoration: underline;
        }
        
        .logo {
            max-width: 200px;
            margin-bottom: 30px;
            filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.3));
        }
        
        @media (max-width: 600px) {
            .maintenance-container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 32px;
            }
            
            .time-unit span {
                font-size: 36px;
            }
            
            .time-separator {
                font-size: 24px;
            }
            
            #countdown-timer {
                gap: 10px;
            }
            
            .time-unit {
                min-width: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="maintenance-container">
        <!-- Logo (décommentez et ajoutez le chemin de votre logo) -->
        <!-- <img src="/prestashop/img/logo.png" alt="Logo DevoRbaits" class="logo"> -->
        
        <div class="maintenance-icon">🔧</div>
        
        <h1>Site en Maintenance</h1>
        
        <p class="subtitle">
            Nous effectuons actuellement des améliorations sur notre site
        </p>
        
        <div class="message">
            <p><strong>Nous serons de retour très bientôt !</strong></p>
            <p>Notre équipe travaille dur pour améliorer votre expérience. Merci de votre patience.</p>
        </div>
        
        <div class="countdown">
            <p>Retour prévu le <strong>15 janvier 2026</strong></p>
            <div id="countdown-timer">
                <div class="time-unit">
                    <span id="days">00</span>
                    <small>Jours</small>
                </div>
                <div class="time-separator">:</div>
                <div class="time-unit">
                    <span id="hours">00</span>
                    <small>Heures</small>
                </div>
                <div class="time-separator">:</div>
                <div class="time-unit">
                    <span id="minutes">00</span>
                    <small>Minutes</small>
                </div>
                <div class="time-separator">:</div>
                <div class="time-unit">
                    <span id="seconds">00</span>
                    <small>Secondes</small>
                </div>
            </div>
        </div>
        
        <div class="contact-info">
            <p>Besoin d'aide ?</p>
            <p>Contactez-nous : <a href="mailto:contact@devorbaits.com">contact@devorbaits.com</a></p>
        </div>
    </div>
    
    <script>
        // Date de fin : 15 janvier 2026 à 00:00:00
        const endDate = new Date('2026-01-15T00:00:00').getTime();
        
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = endDate - now;
            
            // Calculer les jours, heures, minutes et secondes
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Mettre à jour l'affichage
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            
            // Si la date est passée
            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById('countdown-timer').innerHTML = '<span style="color: #10b981; font-size: 24px;">Maintenance terminée !</span>';
            }
        }
        
        // Mettre à jour toutes les secondes
        const countdownInterval = setInterval(updateCountdown, 1000);
        updateCountdown();
    </script>
</body>
</html>
