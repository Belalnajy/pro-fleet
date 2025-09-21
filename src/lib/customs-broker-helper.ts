import { db } from "@/lib/db"

/**
 * Extract customs broker ID from trip notes
 * This function looks for customs broker information in trip notes and returns the broker ID
 */
export async function extractCustomsBrokerFromNotes(notes: string | null): Promise<string | null> {
  if (!notes) return null

  try {
    // Look for customs broker info in notes
    // Patterns to match:
    // 1. "Customs Broker: BrokerName"
    // 2. "المخلص الجمركي: اسم المخلص"
    const patterns = [
      /Customs Broker:\s*([^.]+)/i,
      /المخلص الجمركي:\s*([^.]+)/i
    ]

    let brokerName: string | null = null
    
    for (const pattern of patterns) {
      const match = notes.match(pattern)
      if (match && match[1] && match[1].trim() !== 'غير محدد' && match[1].trim() !== 'None') {
        brokerName = match[1].trim()
        break
      }
    }

    if (!brokerName) return null

    // Find the customs broker by name
    const customsBrokers = await db.customsBroker.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    const foundBroker = customsBrokers.find(broker => 
      broker.user.name.toLowerCase() === brokerName.toLowerCase()
    )
    
    return foundBroker ? foundBroker.id : null

  } catch (error) {
    console.error("Error extracting customs broker from notes:", error)
    return null
  }
}

/**
 * Add customs broker info to trip notes
 * This function adds or updates customs broker information in trip notes
 */
export function addCustomsBrokerToNotes(
  existingNotes: string | null, 
  customsBrokerName: string | null
): string {
  const brokerInfo = customsBrokerName && customsBrokerName !== 'غير محدد' 
    ? customsBrokerName 
    : 'غير محدد'
  
  const brokerText = `Customs Broker: ${brokerInfo}`
  
  if (!existingNotes) {
    return brokerText
  }

  // Remove existing customs broker info if present
  const cleanedNotes = existingNotes
    .replace(/Customs Broker:\s*[^.]+\.?\s*/gi, '')
    .replace(/المخلص الجمركي:\s*[^.]+\.?\s*/gi, '')
    .trim()

  // Add new customs broker info
  return cleanedNotes ? `${cleanedNotes}. ${brokerText}` : brokerText
}

/**
 * Get customs broker name by ID
 */
export async function getCustomsBrokerName(customsBrokerId: string): Promise<string | null> {
  try {
    const customsBroker = await db.customsBroker.findUnique({
      where: { id: customsBrokerId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    return customsBroker ? customsBroker.user.name : null
  } catch (error) {
    console.error("Error getting customs broker name:", error)
    return null
  }
}
