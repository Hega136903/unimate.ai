// Debug script to test voting system
// Run this in the browser console to troubleshoot voting issues

console.log('🔍 Starting Voting System Debug...');

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

console.log('👤 Authentication Status:', {
  hasToken: !!token,
  user: user,
  tokenLength: token?.length || 0
});

// API base URL
const API_BASE_URL = 'http://localhost:5000/api' || window.location.origin + '/api';
console.log('🔗 API Base URL:', API_BASE_URL);

// Test API endpoints
async function testVotingEndpoints() {
  console.log('🧪 Testing voting endpoints...');
  
  try {
    // Test active polls endpoint
    console.log('📡 Testing /voting/polls/active...');
    const pollsResponse = await fetch(`${API_BASE_URL}/voting/polls/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Polls Response:', {
      status: pollsResponse.status,
      statusText: pollsResponse.statusText,
      ok: pollsResponse.ok
    });
    
    if (pollsResponse.ok) {
      const pollsData = await pollsResponse.json();
      console.log('📋 Polls Data:', pollsData);
      
      if (pollsData.success && pollsData.data) {
        console.log(`✅ Found ${pollsData.data.length} active polls`);
        pollsData.data.forEach((poll, index) => {
          console.log(`📝 Poll ${index + 1}:`, {
            id: poll.id,
            title: poll.title,
            isActive: poll.isActive,
            canVote: poll.canVote,
            userHasVoted: poll.userHasVoted,
            startTime: poll.startTime,
            endTime: poll.endTime,
            timeRemaining: poll.timeRemaining
          });
        });
      } else {
        console.log('⚠️ No active polls found or API returned error');
      }
    } else {
      const errorText = await pollsResponse.text();
      console.error('❌ Polls API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Test admin polls endpoint (if user is admin)
async function testAdminEndpoints() {
  if (user.role !== 'admin') {
    console.log('ℹ️ Skipping admin endpoints - user is not admin');
    return;
  }
  
  console.log('🧪 Testing admin endpoints...');
  
  try {
    console.log('📡 Testing /admin/polls...');
    const adminPollsResponse = await fetch(`${API_BASE_URL}/admin/polls`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Admin Polls Response:', {
      status: adminPollsResponse.status,
      statusText: adminPollsResponse.statusText,
      ok: adminPollsResponse.ok
    });
    
    if (adminPollsResponse.ok) {
      const adminPollsData = await adminPollsResponse.json();
      console.log('📋 Admin Polls Data:', adminPollsData);
      
      if (adminPollsData.success && adminPollsData.data) {
        console.log(`✅ Found ${adminPollsData.data.length} total polls in admin panel`);
        adminPollsData.data.forEach((poll, index) => {
          console.log(`📝 Admin Poll ${index + 1}:`, {
            id: poll._id || poll.id,
            title: poll.title,
            isActive: poll.isActive,
            startTime: poll.startTime,
            endTime: poll.endTime,
            totalVotes: poll.totalVotes,
            optionsCount: poll.options?.length || 0
          });
        });
      }
    } else {
      const errorText = await adminPollsResponse.text();
      console.error('❌ Admin Polls API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Admin Network Error:', error);
  }
}

// Check time synchronization
function checkTimeSync() {
  console.log('🕒 Time Synchronization Check:');
  const now = new Date();
  console.log('🖥️ Browser Time:', now.toISOString());
  console.log('🖥️ Browser Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('🖥️ Browser Locale Time:', now.toLocaleString());
}

// Run all tests
async function runDebugTests() {
  console.log('🚀 Running all debug tests...');
  
  checkTimeSync();
  await testVotingEndpoints();
  await testAdminEndpoints();
  
  console.log('✅ Debug tests completed!');
}

// Auto-run tests
runDebugTests();
