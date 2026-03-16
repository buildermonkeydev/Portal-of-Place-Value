s = Submission.last
puts "Manually enqueuing: #{s.token}"
Resque.enqueue(IsolateJob, s.id)
puts "Enqueued!"
