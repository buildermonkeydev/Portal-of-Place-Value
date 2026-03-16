# Create a new submission
s = Submission.create(
  source_code: "#include <iostream>\nint main() { std::cout << \"Hello\"; return 0; }",
  language_id: 52,
  status_id: 1
)

puts "Created submission with token: #{s.token}"

# Manually enqueue it
s.send(:enqueue_job)
puts "Enqueued job"

# Check queue length
result = `redis-cli -h redis -p 6379 -a anothersecret LLEN queue:1.13.1`
puts "Queue length: #{result}"
