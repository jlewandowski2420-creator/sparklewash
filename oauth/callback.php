<?php
/**
 * Decap CMS GitHub OAuth Callback
 * Handles OAuth token exchange for the admin panel
 */

$client_id     = getenv('OAUTH_CLIENT_ID')     ?: 'CHANGE_ME';
$client_secret = getenv('OAUTH_CLIENT_SECRET') ?: 'CHANGE_ME';
$redirect_uri  = 'https://sparklewash.nl/oauth/callback.php';

// Step 1: Redirect to GitHub for authorization
if (!isset($_GET['code'])) {
    $url = 'https://github.com/login/oauth/authorize?' . http_build_query([
        'client_id'    => $client_id,
        'redirect_uri' => $redirect_uri,
        'scope'        => 'repo,user',
    ]);
    header('Location: ' . $url);
    exit;
}

// Step 2: Exchange code for access token
$code = $_GET['code'];

$ch = curl_init('https://github.com/login/oauth/access_token');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'client_id'     => $client_id,
        'client_secret' => $client_secret,
        'code'          => $code,
        'redirect_uri'  => $redirect_uri,
    ]),
    CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

if (!isset($data['access_token'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'OAuth failed', 'details' => $data]);
    exit;
}

// Return token to Decap CMS (it posts to content window)
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage(
    <?php echo json_encode([
        'token'             => $data['access_token'],
        'provider'          => 'github',
        'backendName'       => 'github',
    ]); ?>,
    window.location.origin
  );
  window.close();
</script>
<p>Logged in! This window will close automatically.</p>
</body></html>
