<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site en Maintenance</title>
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
            max-width: 600px;
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
    </style>
</head>
<body>
    <div class="maintenance-container">
        <!-- Logo (décommentez et ajoutez le chemin de votre logo) -->
        <!-- <img src="/img/logo.png" alt="Logo" class="logo"> -->
        
        <div class="maintenance-icon">🔧</div>
        
        <h1>Site en Maintenance</h1>
        
        <p class="subtitle">
            Nous effectuons actuellement des améliorations sur notre site
        </p>
        
        <div class="message">
            <p><strong>Nous serons de retour très bientôt !</strong></p>
            <p>Notre équipe travaille dur pour améliorer votre expérience. Merci de votre patience.</p>
        </div>
        
        <div class="contact-info">
            <p>Besoin d'aide ?</p>
            <p>Contactez-nous : <a href="mailto:devorbaits.contact@gmail.com">devorbaits.contact@gmail.com</a></p>
        </div>
    </div>
</body>
</html>


