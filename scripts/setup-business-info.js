const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupBusinessInfo() {
  console.log('🏢 Setting up business information in system settings...');

  try {
    // Business information settings to add/update
    const businessSettings = [
      // Basic company info
      { key: 'business.companyName', value: 'PRO FLEET' },
      { key: 'business.companyEmail', value: 'info@profleet.app' },
      { key: 'business.companyPhone', value: '+966 53 997 7837' },
      { key: 'business.companyAddress', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'business.website', value: 'www.profleet.app' },
      { key: 'business.domain', value: 'profleet.app' },
    { key: 'business.companyLogo', value: '/Website-Logo.png' },
      
      // Commercial Registration Info
      { key: 'business.commercialRegister', value: '4030522610' },
      { key: 'business.unifiedCommercialRegister', value: '7033220067' },
      { key: 'business.unifiedNumber', value: '8002440411' },
      
      // National Address
      { key: 'business.shortNationalAddress', value: 'JENA7503' },
      { key: 'business.buildingNumber', value: '7503' },
      { key: 'business.subNumber', value: '2695' },
      { key: 'business.postalCode', value: '23621' },
      { key: 'business.district', value: 'النعيم' },
      { key: 'business.street', value: 'الأمير سلطان' },
      { key: 'business.fullNationalAddress', value: 'رقم المبنى 7503 – الرقم الفرعي 2695\nالرمز البريدي 23621 – الحي النعيم\nالشارع الأمير سلطان' },
      
      // Financial settings
      { key: 'financial.defaultTaxRate', value: '15' },
      { key: 'financial.enableVAT', value: 'true' },
      { key: 'financial.vatRate', value: '15' },
      { key: 'financial.defaultCurrency', value: 'SAR' },
      { key: 'financial.currencySymbol', value: 'ر.س' }
    ];

    console.log(`📝 Adding/updating ${businessSettings.length} business settings...`);

    for (const setting of businessSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          key: setting.key,
          value: setting.value,
          isActive: true
        }
      });
      
      console.log(`✅ ${setting.key}: ${setting.value}`);
    }

    console.log('✅ Business information setup completed successfully!');
    console.log('📋 Updated settings:');
    console.log('   - Company Name: PRO FLEET');
    console.log('   - Email: info@profleet.app');
    console.log('   - Phone: +966 53 997 7837');
    console.log('   - Website: www.profleet.app');
    console.log('   - Domain: profleet.app');
    console.log('   - Company Logo: /Website-Logo.png');
    console.log('   - Commercial Register: 4030522610');
    console.log('   - Unified Commercial Register: 7033220067');
    console.log('   - Unified Number: 8002440411');
    console.log('   - National Address: JENA7503');
    console.log('   - Building Number: 7503');
    console.log('   - Sub Number: 2695');
    console.log('   - Postal Code: 23621');
    console.log('   - District: النعيم');
    console.log('   - Street: الأمير سلطان');
  } catch (error) {
    console.error('❌ Error setting up business information:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupBusinessInfo()
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
