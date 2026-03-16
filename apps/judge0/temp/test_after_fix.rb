s = Submission.create(
  source_code: "#include <iostream>\nint main() { std::cout << \"After Fix Test\"; return 0; }",
  language_id: 52,
  status_id: 1
)
puts "Created submission: #{s.token}"
puts "Checking if auto-enqueue worked..."
sleep 2
