puts "Checking Submission model..."
puts "-" * 50

# Check for enqueue_job method
if Submission.method_defined?(:enqueue_job)
  puts "✅ enqueue_job method exists!"
else
  puts "❌ enqueue_job method missing!"
end

# Check for after_commit callback
callbacks = Submission._commit_callbacks.map(&:filter)
puts "Callbacks: #{callbacks.inspect}"
if callbacks.include?(:enqueue_job)
  puts "✅ after_commit :enqueue_job exists!"
else
  puts "❌ after_commit :enqueue_job missing!"
end

puts "-" * 50
