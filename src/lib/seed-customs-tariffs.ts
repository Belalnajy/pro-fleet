import { db as prisma } from "@/lib/db";

export async function seedCustomsTariffs() {
  const tariffs = [
    {
      hsCode: "8703.21.10",
      description:
        "Motor cars with spark-ignition internal combustion reciprocating piston engine, cylinder capacity not exceeding 1000 cc",
      descriptionAr:
        "سيارات ركوب بمحرك احتراق داخلي بمكابس ترددية بالشرارة، سعة الأسطوانة لا تتجاوز 1000 سم مكعب",
      category: "automotive",
      dutyRate: 5.0,
      vatRate: 15.0,
      additionalFees: 500.0
    },
    {
      hsCode: "8703.22.10",
      description:
        "Motor cars with spark-ignition internal combustion reciprocating piston engine, cylinder capacity exceeding 1000 cc but not exceeding 1500 cc",
      descriptionAr:
        "سيارات ركوب بمحرك احتراق داخلي بمكابس ترددية بالشرارة، سعة الأسطوانة تتجاوز 1000 سم مكعب ولكن لا تتجاوز 1500 سم مكعب",
      category: "automotive",
      dutyRate: 10.0,
      vatRate: 15.0,
      additionalFees: 750.0
    },
    {
      hsCode: "8703.23.10",
      description:
        "Motor cars with spark-ignition internal combustion reciprocating piston engine, cylinder capacity exceeding 1500 cc but not exceeding 3000 cc",
      descriptionAr:
        "سيارات ركوب بمحرك احتراق داخلي بمكابس ترددية بالشرارة، سعة الأسطوانة تتجاوز 1500 سم مكعب ولكن لا تتجاوز 3000 سم مكعب",
      category: "automotive",
      dutyRate: 15.0,
      vatRate: 15.0,
      additionalFees: 1000.0
    },
    {
      hsCode: "8703.24.10",
      description:
        "Motor cars with spark-ignition internal combustion reciprocating piston engine, cylinder capacity exceeding 3000 cc",
      descriptionAr:
        "سيارات ركوب بمحرك احتراق داخلي بمكابس ترددية بالشرارة، سعة الأسطوانة تتجاوز 3000 سم مكعب",
      category: "automotive",
      dutyRate: 20.0,
      vatRate: 15.0,
      additionalFees: 1500.0
    },
    {
      hsCode: "8704.21.10",
      description:
        "Motor vehicles for the transport of goods, gross vehicle weight not exceeding 5 tonnes",
      descriptionAr:
        "مركبات نقل البضائع، الوزن الإجمالي للمركبة لا يتجاوز 5 أطنان",
      category: "automotive",
      dutyRate: 5.0,
      vatRate: 15.0,
      additionalFees: 300.0
    },
    {
      hsCode: "8704.22.10",
      description:
        "Motor vehicles for the transport of goods, gross vehicle weight exceeding 5 tonnes but not exceeding 20 tonnes",
      descriptionAr:
        "مركبات نقل البضائع، الوزن الإجمالي للمركبة يتجاوز 5 أطنان ولكن لا يتجاوز 20 طن",
      category: "automotive",
      dutyRate: 5.0,
      vatRate: 15.0,
      additionalFees: 500.0
    },
    {
      hsCode: "8704.23.10",
      description:
        "Motor vehicles for the transport of goods, gross vehicle weight exceeding 20 tonnes",
      descriptionAr: "مركبات نقل البضائع، الوزن الإجمالي للمركبة يتجاوز 20 طن",
      category: "automotive",
      dutyRate: 5.0,
      vatRate: 15.0,
      additionalFees: 800.0
    },
    {
      hsCode: "6403.20.00",
      description:
        "Footwear with outer soles of leather, and uppers which consist of leather straps across the instep and around the big toe",
      descriptionAr:
        "أحذية بنعال خارجية من الجلد، والجزء العلوي يتكون من أشرطة جلدية عبر مشط القدم وحول إصبع القدم الكبير",
      category: "textiles",
      dutyRate: 20.0,
      vatRate: 15.0,
      additionalFees: 50.0
    },
    {
      hsCode: "6204.42.00",
      description: "Women's or girls' dresses of cotton",
      descriptionAr: "فساتين نسائية أو للفتيات من القطن",
      category: "textiles",
      dutyRate: 12.0,
      vatRate: 15.0,
      additionalFees: 25.0
    },
    {
      hsCode: "8517.12.00",
      description:
        "Telephones for cellular networks or for other wireless networks",
      descriptionAr: "هواتف للشبكات الخلوية أو للشبكات اللاسلكية الأخرى",
      category: "electronics",
      dutyRate: 0.0,
      vatRate: 15.0,
      additionalFees: 10.0
    },
    {
      hsCode: "8471.30.00",
      description:
        "Portable automatic data processing machines, weighing not more than 10 kg",
      descriptionAr:
        "آلات معالجة البيانات التلقائية المحمولة، وزنها لا يتجاوز 10 كيلوغرام",
      category: "electronics",
      dutyRate: 0.0,
      vatRate: 15.0,
      additionalFees: 50.0
    },
    {
      hsCode: "2710.19.10",
      description: "Motor spirit (gasoline) and other light oils",
      descriptionAr: "البنزين (الجازولين) والزيوت الخفيفة الأخرى",
      category: "chemicals",
      dutyRate: 0.0,
      vatRate: 15.0,
      additionalFees: 100.0
    },
    {
      hsCode: "1701.14.00",
      description: "Other cane sugar",
      descriptionAr: "سكر القصب الآخر",
      category: "food",
      dutyRate: 5.0,
      vatRate: 15.0,
      additionalFees: 20.0
    },
    {
      hsCode: "0201.10.00",
      description:
        "Carcasses and half-carcasses of bovine animals, fresh or chilled",
      descriptionAr: "ذبائح وأنصاف ذبائح من الحيوانات البقرية، طازجة أو مبردة",
      category: "food",
      dutyRate: 5.0,
      vatRate: 0.0,
      additionalFees: 100.0
    },
    {
      hsCode: "0406.10.00",
      description:
        "Fresh (unripened or uncured) cheese, including whey cheese, and curd",
      descriptionAr:
        "الجبن الطازج (غير الناضج أو غير المعالج)، بما في ذلك جبن مصل اللبن والخثارة",
      category: "food",
      dutyRate: 5.0,
      vatRate: 0.0,
      additionalFees: 25.0
    }
  ];

  console.log("Seeding customs tariffs...");

  for (const tariff of tariffs) {
    await prisma.customsTariff.upsert({
      where: { hsCode: tariff.hsCode },
      update: tariff,
      create: tariff
    });
  }

  console.log(`Seeded ${tariffs.length} customs tariffs`);
}

// Run if called directly
if (require.main === module) {
  seedCustomsTariffs()
    .then(() => {
      console.log("Customs tariffs seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding customs tariffs:", error);
      process.exit(1);
    });
}
