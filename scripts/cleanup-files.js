const fs = require('fs')
const path = require('path')

async function getFileSize(filePath) {
  try {
    const stats = await fs.promises.stat(filePath)
    return stats.size
  } catch (error) {
    return 0
  }
}

async function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function scanDirectory(dirPath) {
  const files = []
  
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)
      
      if (item.isDirectory()) {
        const subFiles = await scanDirectory(fullPath)
        files.push(...subFiles)
      } else {
        const size = await getFileSize(fullPath)
        files.push({
          path: fullPath,
          name: item.name,
          size: size,
          sizeFormatted: await formatBytes(size)
        })
      }
    }
  } catch (error) {
    console.log(`⚠️ لا يمكن الوصول للمجلد: ${dirPath}`)
  }
  
  return files
}

async function analyzeFiles() {
  console.log('🔍 تحليل الملفات المرفوعة...\n')
  
  const directories = ['uploads', 'public/uploads', 'public']
  let allFiles = []
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      console.log(`📁 فحص مجلد: ${dir}`)
      const files = await scanDirectory(dir)
      allFiles.push(...files)
    }
  }
  
  // ترتيب الملفات حسب الحجم
  allFiles.sort((a, b) => b.size - a.size)
  
  console.log('\n📊 أكبر 10 ملفات:')
  allFiles.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.sizeFormatted} - ${file.path}`)
  })
  
  // إحصائيات
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
  const largeFiles = allFiles.filter(file => file.size > 100 * 1024) // أكبر من 100KB
  
  console.log('\n📈 إحصائيات الملفات:')
  console.log(`📁 إجمالي الملفات: ${allFiles.length}`)
  console.log(`💾 الحجم الإجمالي: ${await formatBytes(totalSize)}`)
  console.log(`🔥 الملفات الكبيرة (+100KB): ${largeFiles.length}`)
  
  if (largeFiles.length > 0) {
    const largeFilesSize = largeFiles.reduce((sum, file) => sum + file.size, 0)
    console.log(`💽 حجم الملفات الكبيرة: ${await formatBytes(largeFilesSize)}`)
  }
  
  return { allFiles, largeFiles, totalSize }
}

async function cleanupFiles() {
  console.log('🧹 بدء تنظيف الملفات...\n')
  
  const { largeFiles } = await analyzeFiles()
  
  if (largeFiles.length === 0) {
    console.log('✅ لا توجد ملفات كبيرة للحذف')
    return
  }
  
  console.log('\n🗑️ حذف الملفات الكبيرة القديمة...')
  
  let deletedCount = 0
  let deletedSize = 0
  
  for (const file of largeFiles) {
    try {
      // حذف الملفات أقدم من 30 يوم والأكبر من 500KB
      const stats = await fs.promises.stat(file.path)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (stats.mtime < thirtyDaysAgo && file.size > 500 * 1024) {
        await fs.promises.unlink(file.path)
        console.log(`🗑️ تم حذف: ${file.path} (${file.sizeFormatted})`)
        deletedCount++
        deletedSize += file.size
      }
    } catch (error) {
      console.log(`❌ خطأ في حذف: ${file.path}`)
    }
  }
  
  console.log(`\n✅ تم حذف ${deletedCount} ملف`)
  console.log(`💾 تم توفير: ${await formatBytes(deletedSize)}`)
}

// تشغيل حسب المعامل
if (process.argv.includes('--analyze')) {
  analyzeFiles()
} else if (process.argv.includes('--clean')) {
  cleanupFiles()
} else {
  console.log('استخدم:')
  console.log('node cleanup-files.js --analyze  # لتحليل الملفات')
  console.log('node cleanup-files.js --clean    # لحذف الملفات الكبيرة القديمة')
}
