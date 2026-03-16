model_path = "app/models/submission.rb"
content = File.read(model_path)

# Check if enqueue_job method already exists
if content.include?("def enqueue_job")
  puts "enqueue_job method already exists!"
else
  puts "Adding enqueue_job method..."
  
  # Add the method before the last 'end'
  method_code = <<-RUBY

  def enqueue_job
    # This method adds the submission to Redis queue
    Resque.enqueue(IsolateJob, id)
  end
RUBY
  
  # Insert before the last 'end'
  new_content = content.sub(/end\s*\z/, "#{method_code}\nend")
  File.write(model_path, new_content)
  puts "✅ enqueue_job method added!"
end

# Check if after_commit callback exists
if content.include?("after_commit :enqueue_job")
  puts "after_commit callback already exists!"
else
  puts "Adding after_commit callback..."
  
  # Add the callback in the appropriate place
  callback_code = <<-RUBY

  after_commit :enqueue_job, on: :create
RUBY
  
  # Insert after the validations section
  if content.include?("default_scope")
    new_content = content.sub(/default_scope.*\n/, "\\0#{callback_code}")
    File.write(model_path, new_content)
  else
    # Append at the end of the class before the last 'end'
    new_content = content.sub(/end\s*\z/, "#{callback_code}\nend")
    File.write(model_path, new_content)
  end
  puts "✅ after_commit callback added!"
end

puts "\nVerifying changes..."
puts "File now contains:"
system("grep -n 'enqueue_job' #{model_path}")
