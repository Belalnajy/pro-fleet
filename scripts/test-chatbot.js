const axios = require('axios')

const testQueries = [
  // Tracking tests
  { query: "PRO-20241224-001", category: "تتبع الشحنات" },
  { query: "تتبع شحنتي", category: "تتبع الشحنات" },
  { query: "أين رحلتي؟", category: "تتبع الشحنات" },
  
  // Pricing tests
  { query: "كم سعر النقل من الرياض لجدة؟", category: "الأسعار" },
  { query: "أسعاركم", category: "الأسعار" },
  { query: "الأسعار", category: "الأسعار" },
  
  // Services tests
  { query: "خدماتكم", category: "الخدمات" },
  { query: "أنواع المركبات", category: "الخدمات" },
  { query: "النقل المبرد", category: "الخدمات" },
  
  // Company info tests
  { query: "معلومات عن الشركة", category: "معلومات الشركة" },
  { query: "أرقام التواصل", category: "معلومات الشركة" },
  { query: "من نحن؟", category: "معلومات الشركة" },
  
  // Booking tests
  { query: "أريد حجز رحلة", category: "الحجز" },
  { query: "كيف أحجز؟", category: "الحجز" },
  { query: "حجز", category: "الحجز" },
  
  // Support tests
  { query: "أحتاج مساعدة", category: "الدعم" },
  { query: "لدي مشكلة", category: "الدعم" },
  { query: "تأخير في التوصيل", category: "الدعم" },
  
  // Greetings tests
  { query: "مرحبا", category: "التحية" },
  { query: "السلام عليكم", category: "التحية" },
  { query: "hello", category: "التحية" },
  
  // Specific keywords tests
  { query: "فاتورة", category: "كلمات مفتاحية" },
  { query: "دفع", category: "كلمات مفتاحية" },
  { query: "سائق", category: "كلمات مفتاحية" },
  { query: "أمان", category: "كلمات مفتاحية" },
  
  // Edge cases
  { query: "xyz", category: "حالات خاصة" },
  { query: "؟", category: "حالات خاصة" },
  { query: "كيف الحال؟", category: "حالات خاصة" }
]

async function testChatbot() {
  console.log('🤖 بدء اختبار الشات بوت...\n')
  
  const baseUrl = 'http://localhost:3000'
  let passedTests = 0
  let failedTests = 0
  
  for (const test of testQueries) {
    try {
      console.log(`📝 اختبار: "${test.query}" (${test.category})`)
      
      const response = await axios.post(`${baseUrl}/api/chat/simple`, {
        message: test.query
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 200 && response.data.botResponse) {
        console.log(`✅ نجح - الرد: ${response.data.botResponse.substring(0, 50)}...`)
        passedTests++
      } else {
        console.log(`❌ فشل - لا يوجد رد`)
        failedTests++
      }
      
    } catch (error) {
      console.log(`❌ فشل - خطأ: ${error.message}`)
      failedTests++
    }
    
    console.log('') // فاصل بين الاختبارات
    
    // تأخير قصير بين الطلبات
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // نتائج الاختبار
  console.log('📊 نتائج الاختبار:')
  console.log(`✅ نجح: ${passedTests}`)
  console.log(`❌ فشل: ${failedTests}`)
  console.log(`📈 معدل النجاح: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)
  
  if (failedTests === 0) {
    console.log('\n🎉 جميع الاختبارات نجحت! الشات بوت يعمل بشكل مثالي.')
  } else if (passedTests > failedTests) {
    console.log('\n✅ معظم الاختبارات نجحت. الشات بوت يعمل بشكل جيد.')
  } else {
    console.log('\n⚠️ هناك مشاكل في الشات بوت تحتاج لإصلاح.')
  }
}

async function testSuggestions() {
  console.log('\n💡 اختبار الاقتراحات الذكية...')
  
  try {
    const response = await axios.get('http://localhost:3000/api/chat/simple', {
      timeout: 5000
    })
    
    if (response.status === 200 && response.data.suggestions) {
      console.log(`✅ تم جلب ${response.data.suggestions.length} اقتراح`)
      response.data.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.title} - ${suggestion.action}`)
      })
    } else {
      console.log('❌ فشل في جلب الاقتراحات')
    }
  } catch (error) {
    console.log(`❌ خطأ في جلب الاقتراحات: ${error.message}`)
  }
}

// تشغيل الاختبارات
async function runAllTests() {
  await testChatbot()
  await testSuggestions()
  
  console.log('\n🏁 انتهى الاختبار!')
  console.log('💡 لاختبار الشات بوت يدوياً، اذهب إلى: http://localhost:3000/ar/test-chatbot')
}

runAllTests().catch(console.error)
