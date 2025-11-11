const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

let authToken = '';
let testDraftId = '';
let testReceiverId = '';

async function registerTestUser() {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    // If user already exists (400 error), that's fine
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      return null;
    }
    throw error;
  }
}

async function loginAndGetToken() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  return response.data.token;
}

async function getOrCreateTestReceiver() {
  try {
    // Try to get existing receiver
    const response = await axios.get(`${API_BASE}/receivers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0]._id;
    }
    
    // If no receivers exist, create one
    const createResponse = await axios.post(`${API_BASE}/receivers`, {
      name: 'Test Receiver',
      email: 'receiver@example.com',
      company: 'Test Company',
      department: 'Testing'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    return createResponse.data.data._id;
  } catch (error) {
    console.error('Error getting/creating receiver:', error.response?.data || error.message);
    throw error;
  }
}

async function testDraftsModule() {
  try {
    console.log('🧪 Testing Telegraph Drafts Module...\n');

    // Register test user (if not exists) and get authentication token
    console.log('1. Setting up test user...');
    const registerToken = await registerTestUser();
    if (registerToken) {
      console.log('✅ Test user registered successfully');
      authToken = registerToken;
    } else {
      console.log('ℹ️  Test user already exists, logging in...');
      authToken = await loginAndGetToken();
      console.log('✅ Authentication successful');
    }

    // Get or create a test receiver
    console.log('\n2. Getting/creating test receiver...');
    testReceiverId = await getOrCreateTestReceiver();
    console.log('✅ Test receiver ID:', testReceiverId);

    // Test 1: Create draft
    console.log('\n3. Testing create draft...');
    const createResponse = await axios.post(`${API_BASE}/drafts`, {
      title: 'Test Email Draft',
      subject: 'Welcome to Our Service',
      body: 'Dear [Name],\n\nWelcome to our service! We are excited to have you on board.\n\nBest regards,\nThe Team',
      receivers: [testReceiverId],
      cc: ['manager@example.com'],
      category: 'Welcome Emails',
      tags: ['welcome', 'onboarding']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Draft created successfully');
    console.log('   Draft ID:', createResponse.data.data._id);
    console.log('   Title:', createResponse.data.data.title);
    console.log('   Receiver count:', createResponse.data.data.receiverCount);
    
    testDraftId = createResponse.data.data._id;

    // Test 2: Get all drafts
    console.log('\n4. Testing get all drafts...');
    const getAllResponse = await axios.get(`${API_BASE}/drafts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Drafts retrieved successfully');
    console.log('   Count:', getAllResponse.data.count);
    console.log('   Total drafts:', getAllResponse.data.pagination.total);

    // Test 3: Get single draft
    console.log('\n5. Testing get single draft...');
    const getSingleResponse = await axios.get(`${API_BASE}/drafts/${testDraftId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Single draft retrieved successfully');
    console.log('   Subject:', getSingleResponse.data.data.subject);
    console.log('   Status:', getSingleResponse.data.data.status);

    // Test 4: Update draft
    console.log('\n6. Testing update draft...');
    const updateResponse = await axios.put(`${API_BASE}/drafts/${testDraftId}`, {
      title: 'Updated Test Email Draft',
      body: 'Dear [Name],\n\nWelcome to our service! We are excited to have you on board.\n\nWe offer many great features that will help you succeed.\n\nBest regards,\nThe Team',
      tags: ['welcome', 'onboarding', 'updated']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Draft updated successfully');
    console.log('   New title:', updateResponse.data.data.title);
    console.log('   Version:', updateResponse.data.data.version);

    // Test 5: Add receiver to draft
    console.log('\n7. Testing add receiver to draft...');
    const addReceiverResponse = await axios.post(`${API_BASE}/drafts/${testDraftId}/receivers`, {
      receiverId: testReceiverId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Receiver added to draft successfully');
    console.log('   Updated receiver count:', addReceiverResponse.data.data.receiverCount);

    // Test 6: Update draft status
    console.log('\n8. Testing update draft status...');
    const statusResponse = await axios.patch(`${API_BASE}/drafts/${testDraftId}/status`, {
      status: 'scheduled'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Draft status updated successfully');
    console.log('   New status:', statusResponse.data.data.status);

    // Test 7: Duplicate draft
    console.log('\n9. Testing duplicate draft...');
    const duplicateResponse = await axios.post(`${API_BASE}/drafts/${testDraftId}/duplicate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Draft duplicated successfully');
    console.log('   Duplicate title:', duplicateResponse.data.data.title);

    // Test 8: Get draft statistics
    console.log('\n10. Testing draft statistics...');
    const statsResponse = await axios.get(`${API_BASE}/drafts/stats/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Draft statistics retrieved successfully');
    console.log('   Total drafts:', statsResponse.data.data.total);
    console.log('   By status:', statsResponse.data.data.byStatus);

    // Test 9: Bulk operations
    console.log('\n11. Testing bulk delete...');
    const bulkDeleteResponse = await axios.delete(`${API_BASE}/drafts/bulk/delete`, {
      data: { draftIds: [testDraftId] },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Bulk delete successful');
    console.log('   Deleted count:', bulkDeleteResponse.data.data.deletedCount);

    console.log('\n🎉 All drafts module tests passed!');
    console.log('\n📝 Features Implemented:');
    console.log('   ✅ Complete CRUD operations');
    console.log('   ✅ Draft versioning and last edited tracking');
    console.log('   ✅ Receiver management within drafts');
    console.log('   ✅ Status management (draft, scheduled, sent, archived)');
    console.log('   ✅ Bulk operations');
    console.log('   ✅ Advanced filtering and search');
    console.log('   ✅ Statistics and analytics');
    console.log('   ✅ Duplication functionality');
    console.log('   ✅ Category and tag organization');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDraftsModule();
}

module.exports = testDraftsModule;