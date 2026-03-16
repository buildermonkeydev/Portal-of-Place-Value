sudo bash -c '\
model_path="/api/app/models/submission.rb"
content=$(cat $model_path)

# Check if enqueue_job method exists
if echo "$content" | grep -q "def enqueue_job"; then
  echo "enqueue_job method already exists!"
else
  echo "Adding enqueue_job method..."
  
  # Add the method before the last 'end'
  cat >> $model_path << "EOF"

  def enqueue_job
    # This method adds the submission to Redis queue
    Resque.enqueue(IsolateJob, id)
  end
EOF
  echo "✅ enqueue_job method added!"
fi

# Check if after_commit callback exists
if echo "$content" | grep -q "after_commit :enqueue_job"; then
  echo "after_commit callback already exists!"
else
  echo "Adding after_commit callback..."
  
  # Add the callback
  cat >> $model_path << "EOF"

  after_commit :enqueue_job, on: :create
EOF
  echo "✅ after_commit callback added!"
fi

echo -e "\nVerifying changes:"
grep -n "enqueue_job" $model_path || echo "Not found yet"
'
