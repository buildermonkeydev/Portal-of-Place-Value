puts "Checking enqueue_job method..."
method = Submission.instance_method(:enqueue_job) rescue nil
if method
  puts "enqueue_job exists!"
  puts "Source location: #{method.source_location}"
else
  puts "enqueue_job method not found!"
end
