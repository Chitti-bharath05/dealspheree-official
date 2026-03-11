async function testProfileUpdate() {
    try {
        const email = `testuser_${Date.now()}@example.com`;
        
        // 1. Register test user
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Profile User',
                email: email,
                password: 'password123',
                role: 'customer',
                mobileNumber: `${Date.now().toString().slice(-10)}`
            })
        });
        
        const regData = await regRes.json();
        const token = regData.user.token;
        console.log('Registered successfully. Token:', token.substring(0, 15) + '...');

        // 2. Update profile
        const updateRes = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: 'Updated Name',
                phone: '1234567890',
                city: 'New City'
            })
        });

        const updateData = await updateRes.json();
        console.log('Profile update response:', updateData);
        
        if (!updateRes.ok) {
            console.error('SERVER FAILED:', updateData);
        }
    } catch (error) {
        console.error('Error during test:', error.message);
    }
}

testProfileUpdate();
