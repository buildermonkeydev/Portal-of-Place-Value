s = Submission.last
if s
  puts "Token: #{s.token}"
  puts "Status ID: #{s.status_id}"
  puts "Created at: #{s.created_at}"
else
  puts "No submissions found"
end
