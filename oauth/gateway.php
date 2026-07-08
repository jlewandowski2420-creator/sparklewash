<?php
/**
 * Git Gateway for Decap CMS
 * Handles all CMS operations via GitHub API using server-side token.
 * No OAuth needed — client logs in with a password.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sparklewash.nl');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── CONFIG ──────────────────────────
$config_file = __DIR__ . '/.gateway-config.json';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Gateway not configured']);
    exit;
}
$config = json_decode(file_get_contents($config_file), true);
$GITHUB_TOKEN = $config['github_token'];
$REPO_OWNER   = 'jlewandowski2420-creator';
$REPO_NAME    = 'sparklewash';
$BRANCH       = 'main';
$ADMIN_PASS   = $config['admin_password'];

// ── AUTH ────────────────────────────
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = trim(str_replace('/oauth/', '', $path), '/');

// Login
if ($action === 'auth' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $body['password'] ?? '';
    if ($pass === $ADMIN_PASS) {
        echo json_encode(['token' => 'gateway-token', 'user' => 'admin']);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid password']);
    }
    exit;
}

// Verify token for all other endpoints
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($auth !== 'Bearer gateway-token') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── GITHUB API HELPER ────────────────
function gh($method, $endpoint, $data = null) {
    global $GITHUB_TOKEN;
    $ch = curl_init("https://api.github.com$endpoint");
    $headers = [
        'Authorization: Bearer ' . $GITHUB_TOKEN,
        'Accept: application/vnd.github.v3+json',
        'User-Agent: SparkleWash-CMS',
    ];
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    return json_decode(curl_exec($ch), true);
}

// ── ROUTES ───────────────────────────
$base = "/repos/$REPO_OWNER/$REPO_NAME";

switch ($action) {
    // Get file content
    case 'get':
        $file = $_GET['path'] ?? $body['path'] ?? '';
        $result = gh('GET', "$base/contents/$file?ref=$BRANCH");
        if (isset($result['content'])) {
            echo json_encode([
                'content' => base64_decode($result['content']),
                'sha'     => $result['sha'],
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'File not found']);
        }
        break;

    // Save/update file
    case 'save':
        $file = $body['path'] ?? '';
        $content = $body['content'] ?? '';
        $sha = $body['sha'] ?? null;
        $message = $body['message'] ?? 'CMS update';
        
        $payload = [
            'message' => $message,
            'content' => base64_encode($content),
            'branch'  => $BRANCH,
        ];
        if ($sha) $payload['sha'] = $sha;
        
        gh('PUT', "$base/contents/$file", $payload);
        echo json_encode(['ok' => true]);
        break;

    // List directory
    case 'list':
        $dir = $_GET['path'] ?? 'data';
        $result = gh('GET', "$base/contents/$dir?ref=$BRANCH");
        $files = array_map(fn($f) => [
            'name' => $f['name'],
            'path' => $f['path'],
            'sha'  => $f['sha'],
        ], is_array($result) ? $result : []);
        echo json_encode($files);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown action', 'action' => $action]);
}
