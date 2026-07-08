<?php
/**
 * Git Gateway for Decap CMS — Multi-Repo
 * Handles CMS operations for any repo via GitHub API.
 * No OAuth needed — client logs in with a password.
 */

// ── CORS ─────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['https://sparklewash.nl', 'https://jlewandowski2420-creator.github.io', 'http://localhost:3000', 'http://localhost:3001'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── CONFIG ──────────────────────────
$config_file = __DIR__ . '/.gateway-config.json';
if (!file_exists($config_file)) {
    http_response_code(500); echo json_encode(['error' => 'Gateway not configured']); exit;
}
$config   = json_decode(file_get_contents($config_file), true);
$GH_TOKEN = $config['github_token'];
$PASS     = $config['admin_password'];

// ── PARSE ───────────────────────────
$body   = json_decode(file_get_contents('php://input'), true) ?: [];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = trim(str_replace('/oauth/', '', $path), '/');

// ── AUTH ───────────────────────────
if ($action === 'auth' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $body['password'] ?? '';
    if ($pass === $PASS) {
        echo json_encode(['token' => 'gateway-token', 'user' => 'admin']);
    } else {
        http_response_code(401); echo json_encode(['error' => 'Invalid password']);
    }
    exit;
}

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($auth !== 'Bearer gateway-token') {
    http_response_code(401); echo json_encode(['error' => 'Unauthorized']); exit;
}

// ── REPO (from request body) ────────
$repo  = $body['repo']  ?? 'sparklewash';
$owner = $body['owner'] ?? 'jlewandowski2420-creator';
$branch = $body['branch'] ?? 'main';
$base   = "/repos/$owner/$repo";

// ── GITHUB HELPER ───────────────────
function gh($method, $endpoint, $data = null) {
    global $GH_TOKEN;
    $ch = curl_init("https://api.github.com$endpoint");
    $headers = [
        "Authorization: Bearer $GH_TOKEN",
        'Accept: application/vnd.github.v3+json',
        'User-Agent: CMS-Gateway/1.0',
    ];
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($headers, ['Content-Type: application/json']));
    }
    return json_decode(curl_exec($ch), true);
}

// ── ROUTES ──────────────────────────
switch ($action) {
    case 'get':
        $file   = $_GET['path'] ?? $body['path'] ?? '';
        $result = gh('GET', "$base/contents/$file?ref=$branch");
        if (isset($result['content'])) {
            echo json_encode(['content' => base64_decode($result['content']), 'sha' => $result['sha']]);
        } else {
            http_response_code(404); echo json_encode(['error' => 'File not found', 'details' => $result]);
        }
        break;

    case 'save':
        $file    = $body['path'] ?? '';
        $content = $body['content'] ?? '';
        $sha     = $body['sha'] ?? null;
        $message = $body['message'] ?? 'CMS update';
        $payload = ['message' => $message, 'content' => base64_encode($content), 'branch' => $branch];
        if ($sha) $payload['sha'] = $sha;
        gh('PUT', "$base/contents/$file", $payload);
        echo json_encode(['ok' => true]);
        break;

    case 'list':
        $dir    = $_GET['path'] ?? 'data';
        $result = gh('GET', "$base/contents/$dir?ref=$branch");
        $files  = array_map(fn($f) => ['name' => $f['name'], 'path' => $f['path'], 'sha' => $f['sha']], is_array($result) ? $result : []);
        echo json_encode($files);
        break;

    default:
        http_response_code(404); echo json_encode(['error' => 'Unknown action']);
}
