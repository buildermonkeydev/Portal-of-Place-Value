puts "Checking Submission model callbacks..."
puts "After commit callbacks:"
puts Submission._commit_callbacks.map(&:filter).inspect
