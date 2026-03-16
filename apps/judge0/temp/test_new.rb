s = Submission.create(
  source_code: "#include <iostream>\nint main() { std::cout << \"Queue Test\"; return 0; }",
  language_id: 52,
  status_id: 1
)
puts "Created submission: #{s.token}"
puts "Waiting 2 seconds for queue..."
sleep 2
