sudo bash -c '\
cat >> /api/app/models/submission.rb << "EOF"

  def enqueue_job
    Resque.enqueue(IsolateJob, id)
  end

  after_commit :enqueue_job, on: :create
EOF
echo "✅ Submission model updated!"
'
