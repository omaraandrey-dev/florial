const projectId = "bxvcy0qs";
const dataset = "production";
const token = process.env.SANITY_AUTH_TOKEN;

if (!token) {
  throw new Error("SANITY_AUTH_TOKEN is required; token value is never printed.");
}

const translations = {
  "d9a591ba-c63b-4d8c-8cae-3a6aed6e2b8d": {
    ru: {
      name: "Другие компоненты для полива",
      description: "Дополнительные компоненты и аксессуары для монтажа, соединения и обслуживания систем автоматического полива. Они дополняют дождеватели, клапаны, контроллеры и трубы и помогают завершить проект. Перед покупкой проверьте совместимость с вашей системой, размеры подключений и рабочее давление. Если нужной детали нет в других категориях, проверьте этот раздел."
    },
    en: {
      name: "Other Irrigation Components",
      description: "Additional components and accessories for installing, connecting and maintaining automatic irrigation systems. They complement sprinklers, valves, controllers and pipes to help complete your project. Before purchasing, check compatibility with your system, connection sizes and operating pressure. If you cannot find a specific part in another category, check this section."
    }
  },
  "category-valves-24v": {
    ru: {
      name: "Электромагнитные клапаны 24 В",
      description: "Клапаны с соленоидом 24 В обычно используются в системах полива с контроллером, подключённым к электросети. Они автоматически подают воду в отдельную зону по команде контроллера. Перед покупкой убедитесь, что контроллер поддерживает клапаны 24 В, и выберите подходящий размер подключения с учётом расхода и рабочего давления. Для автономных контроллеров на батарейках нужны совместимые клапаны 9 В."
    },
    en: {
      name: "24 V Solenoid Valves",
      description: "Valves with a 24 V solenoid are commonly used in irrigation systems with a mains-powered controller. They automatically supply water to an individual zone when commanded by the controller. Before buying, confirm that your controller supports 24 V valves and choose the connection size according to the required flow rate and operating pressure. Battery-powered controllers require compatible 9 V valves."
    }
  },
  "category-valves-9v": {
    ru: {
      name: "Электромагнитные клапаны 9 В",
      description: "Клапаны с соленоидом 9 В предназначены для автономных контроллеров на батарейках и позволяют автоматизировать полив там, где нет электросети. Они подходят для небольших и средних садов, клумб, террас и систем капельного полива. Проверьте совместимость с моделью контроллера: клапан 9 В нельзя подключать к контроллеру для клапанов 24 В. Также учитывайте размер подключения, расход и давление."
    },
    en: {
      name: "9 V Solenoid Valves",
      description: "Valves with a 9 V solenoid are designed for battery-powered controllers, enabling automatic irrigation where mains electricity is unavailable. They suit small and medium gardens, flower beds, terraces and drip systems. Check compatibility with your controller model: a 9 V valve must not be connected to a controller designed for 24 V valves. Also consider connection size, flow rate and operating pressure."
    }
  },
  "e577ef6b-d164-488f-b2f0-29ff7e8e7e9b": {
    ru: {
      name: "Капельный полив",
      description: "Капельный полив подаёт воду медленно и непосредственно к корням растений, сокращая испарение и расход воды. Он подходит для живых изгородей, кустарников, деревьев, цветников, огородов и контейнерных растений. В категории представлены капельные трубки и шланги, фитинги, фильтры и регуляторы давления. Выбирайте компоненты с учётом источника воды, давления, расхода и схемы посадки. Система может работать автоматически с контроллером и клапанами."
    },
    en: {
      name: "Drip Irrigation",
      description: "Drip irrigation delivers water slowly and directly to plant root zones, reducing evaporation and water use. It is suitable for hedges, shrubs, trees, flower beds, vegetable gardens and container plants. This category includes drip tubing, fittings, filters and pressure regulators. Choose components according to the water source, pressure, flow rate and planting layout. The system can be automated with a controller and valves."
    }
  },
  "category-drip-tubes": {
    ru: {
      name: "Трубки для капельного полива",
      description: "Трубки для капельного полива подают воду через встроенные эмиттеры, расположенные на заданном расстоянии друг от друга. Они подходят для живых изгородей, рядов кустарников и деревьев, цветников и огородов. При выборе учитывайте расстояние между эмиттерами, диаметр трубки, расход, допустимую длину линии и рабочее давление. Для защиты эмиттеров от засорения и стабильной работы системы рекомендуется установить фильтр и регулятор давления."
    },
    en: {
      name: "Drip Irrigation Tubing",
      description: "Drip irrigation tubing delivers water through built-in emitters spaced at regular intervals. It is suitable for hedges, rows of shrubs and trees, flower beds and vegetable gardens. When choosing tubing, consider emitter spacing, tube diameter, flow rate, maximum line length and operating pressure. A filter and pressure regulator are recommended to protect the emitters from clogging and keep the system working reliably."
    }
  },
  "category-drip-fittings": {
    ru: {
      name: "Фитинги для капельного полива",
      description: "Фитинги для капельного полива соединяют трубки с основной линией, позволяют делать ответвления и повороты, а также закрывать концы линий. Обычно используются соединители, углы, тройники, адаптеры и заглушки. Правильно подобранные фитинги обеспечивают герметичные соединения и упрощают расширение системы. Перед покупкой проверьте диаметр трубки, тип соединения и совместимость с фильтрами и регуляторами давления."
    },
    en: {
      name: "Drip Irrigation Fittings",
      description: "Drip irrigation fittings connect tubing to the main line, create branches and turns, and close the ends of irrigation lines. Common parts include couplers, elbows, tees, adapters and end caps. Correct fittings provide leak-resistant connections and make it easier to expand the system. Before purchasing, check the tubing diameter, connection type and compatibility with filters and pressure regulators."
    }
  },
  "65742b44-11c2-43ae-9551-e91eb675dc93": {
    ru: {
      name: "Клапаны для полива",
      description: "Клапаны открывают и перекрывают подачу воды в отдельные зоны автоматической системы полива по команде контроллера. При выборе учитывайте напряжение соленоида — 24 В или 9 В, размер подключения, требуемый расход и рабочее давление. Клапаны обычно устанавливают в клапанном боксе вместе с коллектором и фитингами. Проверьте совместимость с контроллером и оставьте свободный доступ для обслуживания."
    },
    en: {
      name: "Irrigation Valves",
      description: "Irrigation valves open and close the water supply to individual zones of an automatic irrigation system when commanded by the controller. When choosing a valve, consider solenoid voltage—24 V or 9 V—connection size, required flow rate and operating pressure. Valves are usually installed in a valve box with a manifold and fittings. Check controller compatibility and keep the assembly accessible for maintenance."
    }
  },
  "category-controllers-outdoor": {
    ru: {
      name: "Контроллеры наружной установки",
      description: "Контроллеры наружной установки предназначены для монтажа на улице, например на стене дома или ограждении. Они подходят, когда рядом с зонами полива нет сухого технического помещения. Выбирайте устройство по количеству зон, нужным программам, доступному электропитанию и типу клапанов. Устанавливайте контроллер в доступном месте, защищённом от прямого попадания воды и сильного солнца. Если электросети нет, рассмотрите автономный контроллер на батарейках."
    },
    en: {
      name: "Outdoor Irrigation Controllers",
      description: "Outdoor irrigation controllers are designed to be installed outside, for example on a house wall or fence. They are useful when no dry utility room is available near the irrigation zones. Choose according to the number of zones, required programs, available power and valve type. Install the controller in an accessible location protected from direct water flow and intense sunlight. If mains power is unavailable, consider a battery-powered controller."
    }
  },
  "category-controllers-indoor": {
    ru: {
      name: "Контроллеры для помещений",
      description: "Контроллеры для внутренней установки монтируются в гараже, техническом помещении, подвале или другом сухом защищённом месте и управляют поливом по заданному расписанию. Выбирайте модель по числу зон, необходимым программам и функциям, а также типу электромагнитных клапанов. Проверьте напряжение клапанов и предусмотрите прокладку кабеля к зонам. Защита от дождя и прямого солнца помогает продлить срок службы устройства."
    },
    en: {
      name: "Indoor Irrigation Controllers",
      description: "Indoor irrigation controllers are installed in a garage, utility room, basement or another dry, protected location and run watering according to a schedule. Choose a model based on the number of zones, required programs and features, and the type of solenoid valves. Check valve voltage and plan cable routing to the irrigation zones. Keeping the controller away from rain and direct sunlight helps extend its service life."
    }
  },
  "category-controllers-sensors": {
    ru: {
      name: "Датчики и автоматизация полива",
      description: "Датчики и дополнительные устройства помогают сделать систему полива более экономичной и удобной. Они могут передавать контроллеру информацию об условиях окружающей среды или обеспечивать дистанционное управление и дополнительные функции автоматизации. Перед покупкой проверьте совместимость с моделью контроллера, тип подключения и поддерживаемые функции. Подходящая автоматизация помогает поливать только при необходимости и сокращать расход воды."
    },
    en: {
      name: "Irrigation Sensors & Automation",
      description: "Sensors and additional devices make an irrigation system more efficient and convenient. Depending on the model, they can provide the controller with information about environmental conditions or add remote control and automation features. Before buying, check compatibility with your controller model, connection type and supported functions. Suitable automation helps water only when needed and reduce water use."
    }
  },
  "7b11a55e-19a1-4fe5-8a94-2df53864aaf0": {
    ru: {
      name: "Трубы, фитинги и аксессуары",
      description: "В этой категории собраны трубы, гибкие соединения, фитинги, соединители и аксессуары для монтажа системы полива. Они подают воду от источника к клапанам и дождевателям и обеспечивают герметичное соединение компонентов. При выборе учитывайте диаметр и тип трубы, рабочее давление, расход и способ монтажа. Проверьте размеры и тип соединений, чтобы все детали были совместимы и не возникали утечки или потери давления."
    },
    en: {
      name: "Pipes, Fittings & Accessories",
      description: "This category brings together pipes, flexible connections, fittings, couplers and accessories for installing an irrigation system. They carry water from the source to valves and sprinklers and provide secure, leak-resistant connections. Consider pipe diameter and type, operating pressure, flow rate and installation method. Check connection sizes and types to ensure compatibility and avoid leaks or pressure loss."
    }
  },
  "1893467b-642c-4b5f-b6bf-e9d3219c0a2d": {
    ru: {
      name: "Фильтры и регуляторы давления",
      description: "Фильтры задерживают частицы в воде и защищают капельные эмиттеры от засорения, а регуляторы снижают и стабилизируют давление до подходящего для системы уровня. Эти компоненты особенно важны при использовании воды из колодца, скважины или резервуара. При выборе учитывайте расход, давление источника, размер подключения и степень фильтрации. Регулярно очищайте фильтр, чтобы поддерживать равномерный полив и продлить срок службы оборудования."
    },
    en: {
      name: "Filters & Pressure Regulators",
      description: "Filters trap particles in the water and protect drip emitters from clogging, while pressure regulators reduce and stabilise pressure to a level suitable for the irrigation system. These components are especially important when using water from a well, borehole or tank. Consider flow rate, source pressure, connection size and filtration rating when choosing. Clean the filter regularly to maintain even watering and extend equipment life."
    }
  },
  "category-pipe-valve-fittings": {
    ru: {
      name: "Фитинги для клапанов",
      description: "Фитинги для клапанов соединяют электромагнитные клапаны с основной трубой и линиями отдельных зон. В эту группу входят коллекторы, адаптеры и соединители, позволяющие компактно разместить клапаны в боксе и упростить обслуживание. При выборе учитывайте диаметр труб и клапанов, тип резьбы и количество зон. Оставьте в боксе достаточно места для доступа к соединениям при ремонте."
    },
    en: {
      name: "Valve Fittings",
      description: "Valve fittings connect solenoid valves to the main pipe and to the lines serving individual zones. This group includes manifolds, adapters and couplers that help arrange valves neatly in a valve box and simplify maintenance. Check pipe and valve diameters, thread type and the number of zones when selecting components. Leave enough room in the box to access connections during servicing."
    }
  },
  "category-pipe-sprinkler-fittings": {
    ru: {
      name: "Фитинги для дождевателей",
      description: "Фитинги для дождевателей соединяют корпус дождевателя с трубопроводом системы полива. Гибкие подводки и соединители позволяют точно выставить дождеватель по высоте и уменьшают риск повреждения труб при нагрузке на газон. Перед покупкой проверьте тип и размер резьбы, диаметр трубы и рабочее давление. Используйте детали, предназначенные для поливных систем, чтобы обеспечить герметичность и упростить замену дождевателя."
    },
    en: {
      name: "Sprinkler Fittings",
      description: "Sprinkler fittings connect a sprinkler body to the irrigation pipe network. Flexible swing joints and connectors help position the sprinkler at the correct height and reduce the risk of pipe damage from pressure on the lawn. Before buying, check thread type and size, pipe diameter and operating pressure. Use components designed for irrigation systems to ensure leak-resistant connections and make sprinkler replacement easier."
    }
  }
};

const mutations = Object.entries(translations).map(([id, value]) => ({
  patch: {id, set: {translations: value}}
}));

async function mutate(dryRun) {
  const url = `https://${projectId}.api.sanity.io/v2025-02-19/data/mutate/${dataset}?returnDocuments=true&visibility=sync${dryRun ? "&dryRun=true" : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({mutations})
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Sanity mutation ${dryRun ? "dry run" : "write"} failed (HTTP ${response.status}): ${body}`);
  }
  return JSON.parse(body);
}

const preview = await mutate(true);
console.log(`Dry run accepted for ${mutations.length} category translations.`);
const result = await mutate(false);
console.log(`Updated ${result.results?.length ?? 0} irrigation categories with RU/EN names and descriptions.`);
console.log("Updated document IDs:", result.results?.map(item => item.id).join(", "));
