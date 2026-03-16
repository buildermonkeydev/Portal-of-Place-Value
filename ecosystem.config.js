module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      cwd: process.cwd(),
      instances: 4, // Number of PM2 instances
      exec_mode: "cluster", // Use PM2 cluster mode
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '5G',
      node_args: '--max-old-space-size=4096',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '30s',
      kill_timeout: 5000,
      wait_ready: false, // Changed to false since we removed clustering
      listen_timeout: 10000,
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'run start -- -p 3001',
      cwd: './apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '4G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    },
    {
      name: 'worker',
      script: 'apps/worker/dist/index.js',
      cwd: process.cwd(),
      instances: 2,
      exec_mode: 'cluster',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '3G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    }
  ]
};