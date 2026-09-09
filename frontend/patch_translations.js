import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales')

const translations = {
    en: {
        ml_analysis_new: {
            header: {
                badge: "AI Insights",
                title: "Why did the AI decide this?",
                desc: "Upload a grain image or select a past scan to see the AI's reasoning — confidence level, visual focus areas, and recommended actions.",
                analyze_diff: "Analyze a different image",
                or_dashboard: "or open a scan from the Quality Dashboard"
            },
            upload: {
                title: "Upload Image for Analysis",
                desc: "Upload a grain image to instantly generate Grad-CAM explanations",
                drop_title: "Drop an image here or click to browse",
                drop_desc: "JPG, PNG, WEBP — any grain image",
                analyzing: "Analyzing image with AI…",
                analyzing_sub: "Segmenting grains, running ResNet50, computing Grad-CAM…",
                processing: "Processing…",
                err_invalid: "Please select a valid image file.",
                err_fail: "Upload failed. Make sure the backend is running."
            },
            summary: {
                title: "AI Summary",
                subtitle: "Based on actual scan results",
                pct_100: "All {{count}} detected {{type}} grains were classified as Normal — excellent batch quality.",
                pct_80: "{{pct}}% of {{count}} {{type}} grains are Normal. {{defects}} grains flagged for defects. Batch quality is good but minor inspection recommended.",
                pct_50: "{{pct}}% of {{count}} {{type}} grains are Normal. {{defects}} defective grains detected — further inspection is advised before dispatch.",
                pct_bad: "Only {{pct}}% of {{count}} {{type}} grains are Normal. Significant defects found. Manual verification is strongly recommended."
            },
            confidence: {
                title: "AI Confidence",
                subtitle: "Select a grain to see how confident the AI is",
                select_grain: "Select Grain ({{count}} detected)",
                prediction: "Prediction",
                score: "Confidence",
                low_note: "⚠ AI confidence is low for this grain — treat the prediction as indicative only and perform a physical inspection to confirm the defect type before taking action.",
                disclaimer: "Confidence does not guarantee correctness. It reflects how certain the AI model is — not a definitive quality certificate."
            },
            xai: {
                title: "Where the AI Was Looking",
                subtitle: "Grad-CAM visual explanation for Grain #{{idx}}",
                generating: "Generating AI explanation…",
                error: "Could not generate AI explanation. Try a newer scan.",
                not_avail: "Not available",
                original: { title: "Original Grain", desc: "The raw crop as seen by the AI" },
                heatmap: { title: "Focus Heatmap", desc: "Red = key decision areas; Blue = less important" },
                overlay: { title: "Overlay", desc: "Combined view showing where the AI was \"looking\"" },
                prediction_note: "Predicted:",
                prediction_confidence: "with {{conf}}% confidence.",
                prediction_disclaimer: "Confidence does not guarantee correctness — always cross-check with physical inspection for critical decisions."
            },
            remedies: {
                section_title: "Recommended Remedy",
                Normal: {
                    headline: "Grain is Ready for Storage or Dispatch",
                    steps: [
                        "Proceed with standard bagging and storage in a dry, ventilated warehouse.",
                        "Maintain storage humidity below 14% to preserve quality.",
                        "Label batch with today's scan ID for traceability."
                    ]
                },
                Broken: {
                    headline: "Segregate and Regrade Broken Grains",
                    steps: [
                        "Separate broken grains from the main batch using a mechanical sieve (1.6–1.8 mm).",
                        "Downgrade broken grain for secondary uses: flour milling, animal feed, or starch extraction.",
                        "Check threshing machine settings — excessive breakage often indicates improper drum speed.",
                        "Record breakage percentage for supplier quality feedback if applicable."
                    ]
                },
                Chalky: {
                    headline: "Re-Condition Chalky Grains Before Milling",
                    steps: [
                        "Chalky appearance typically indicates immature harvest or rapid post-harvest drying.",
                        "Check grain moisture — re-dry slowly at 40–45 °C to reduce chalkiness without increasing breakage.",
                        "Blend chalky grains with translucent grains at ≤20% ratio to maintain acceptable grade.",
                        "Review field harvest timing — harvesting at 20–25% moisture reduces chalkiness at source."
                    ]
                },
                Discolored: {
                    headline: "Quarantine and Investigate Discolored Grains",
                    steps: [
                        "Immediately segregate discolored grains from the batch to prevent cross-contamination.",
                        "Inspect for fungal growth (dark/black spots may indicate Aspergillus or Fusarium).",
                        "Test a sample for aflatoxin if discoloration is widespread — do NOT dispatch without clearance.",
                        "Trace discoloration cause: excess field moisture, improper storage, or pest damage.",
                        "Discolored grains failing safety tests should be disposed of per local regulatory guidelines."
                    ]
                }
            },
            advanced: {
                title: "Advanced Model Information",
                subtitle: "Technical metrics, training curves and confusion matrix",
                loading: "Loading model metrics…",
                empty: "No training metrics found. Ensure ML Pipeline reports are generated.",
                metrics: {
                    accuracy: "Grains Graded Correctly",
                    score: "Overall AI Health Score",
                    trust: "Trust Level",
                    catch: "Catch Rate"
                },
                category_title: "Performance by Grain Category",
                category_score: "Score: {{score}}%",
                learning_title: "Learning Progress",
                mistakes_title: "Mistakes Made Over Time",
                confusion_title: "Where Mix-Ups Happen",
                confusion_desc: "See exactly which grain types the AI gets confused by (Actual vs. AI Prediction)"
            }
        }
    },
    hi: {
        ml_analysis_new: {
            header: {
                badge: "एआई अंतर्दृष्टि",
                title: "एआई ने यह निर्णय क्यों लिया?",
                desc: "एआई के तर्क - विश्वास स्तर, दृश्य फोकस क्षेत्र, और अनुशंसित क्रियाओं को देखने के लिए अनाज की छवि अपलोड करें या पिछला स्कैन चुनें।",
                analyze_diff: "दूसरी छवि का विश्लेषण करें",
                or_dashboard: "या गुणवत्ता डैशबोर्ड से एक स्कैन खोलें"
            },
            upload: {
                title: "विश्लेषण के लिए छवि अपलोड करें",
                desc: "Grad-CAM स्पष्टीकरण तुरंत उत्पन्न करने के लिए अनाज की छवि अपलोड करें",
                drop_title: "छवि को यहां छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
                drop_desc: "JPG, PNG, WEBP - कोई भी अनाज छवि",
                analyzing: "एआई के साथ छवि का विश्लेषण किया जा रहा है...",
                analyzing_sub: "अनाजों को अलग करना, ResNet50 चलाना, Grad-CAM की गणना करना...",
                processing: "प्रसंस्करण...",
                err_invalid: "कृपया एक वैध छवि फ़ाइल चुनें।",
                err_fail: "अपलोड विफल रहा। सुनिश्चित करें कि बैकएंड चल रहा है।"
            },
            summary: {
                title: "एआई सारांश",
                subtitle: "वास्तविक स्कैन परिणामों के आधार पर",
                pct_100: "सभी {{count}} पता लगाए गए {{type}} अनाजों को सामान्य के रूप में वर्गीकृत किया गया था - उत्कृष्ट बैच गुणवत्ता।",
                pct_80: "कुल {{count}} {{type}} अनाजों में से {{pct}}% सामान्य हैं। {{defects}} अनाजों में दोष पाए गए। बैच की गुणवत्ता अच्छी है लेकिन मामूली निरीक्षण की सिफारिश की जाती है।",
                pct_50: "कुल {{count}} {{type}} अनाजों में से {{pct}}% सामान्य हैं। {{defects}} दोषपूर्ण अनाज पाए गए - प्रेषण से पहले आगे निरीक्षण की सलाह दी जाती है।",
                pct_bad: "कुल {{count}} {{type}} अनाजों में से केवल {{pct}}% सामान्य हैं। महत्वपूर्ण दोष पाए गए। मैन्युअल सत्यापन की दृढ़ता से सिफारिश की जाती है।"
            },
            confidence: {
                title: "एआई विश्वास",
                subtitle: "यह देखने के लिए एक अनाज का चयन करें कि एआई कितना आश्वस्त है",
                select_grain: "अनाज चुनें ({{count}} पता चला)",
                prediction: "भविष्यवाणी",
                score: "विश्वास",
                low_note: "⚠ इस अनाज के लिए एआई का विश्वास कम है - किसी भी कार्रवाई से पहले दोष की पुष्टि के लिए केवल सांकेतिक के रूप में भविष्यवाणी का उपयोग करें और शारीरिक निरीक्षण करें।",
                disclaimer: "विश्वास शुद्धता की गारंटी नहीं देता है। यह दर्शाता है कि एआई मॉडल कितना निश्चित है - यह एक निश्चित गुणवत्ता प्रमाण पत्र नहीं है।"
            },
            xai: {
                title: "एआई कहां देख रहा था",
                subtitle: "अनाज #{{idx}} के लिए Grad-CAM दृश्य स्पष्टीकरण",
                generating: "एआई स्पष्टीकरण उत्पन्न कर रहा है...",
                error: "एआई स्पष्टीकरण उत्पन्न नहीं कर सका। नया स्कैन आज़माएं।",
                not_avail: "उपलब्ध नहीं है",
                original: { title: "मूल अनाज", desc: "कच्ची फसल जैसा कि एआई द्वारा देखा गया" },
                heatmap: { title: "फोकस हीटमैप", desc: "लाल = मुख्य निर्णय क्षेत्र; नीला = कम महत्वपूर्ण" },
                overlay: { title: "ओवरले", desc: "संयुक्त दृश्य यह दिखा रहा है कि एआई कहां 'देख' रहा था" },
                prediction_note: "भविष्यवाणी:",
                prediction_confidence: "{{conf}}% विश्वास के साथ।",
                prediction_disclaimer: "विश्वास शुद्धता की गारंटी नहीं देता है - हमेशा महत्वपूर्ण निर्णयों के लिए शारीरिक निरीक्षण के साथ क्रॉस-चेक करें।"
            },
            remedies: {
                section_title: "अनुशंसित उपाय",
                Normal: {
                    headline: "अनाज भंडारण या प्रेषण के लिए तैयार है",
                    steps: [
                        "सूखे, हवादार गोदाम में मानक बैगिंग और भंडारण के साथ आगे बढ़ें।",
                        "गुणवत्ता बनाए रखने के लिए भंडारण आर्द्रता को 14% से कम रखें।",
                        "निगरानी के लिए आज के स्कैन आईडी के साथ बैच को लेबल करें।"
                    ]
                },
                Broken: {
                    headline: "टूटे हुए अनाजों को अलग करें और फिर से ग्रेड करें",
                    steps: [
                        "मैकेनिकल छलनी (1.6-1.8 मिमी) का उपयोग करके मुख्य बैच से टूटे हुए अनाजों को अलग करें।",
                        "टूटे हुए अनाज को द्वितीयक उपयोग के लिए डाउनग्रेड करें: आटा पीसना, पशु चारा, या स्टार्च निष्कर्षण।",
                        "थ्रेसिंग मशीन सेटिंग्स की जांच करें - अत्यधिक टूटना अक्सर अनुचित ड्रम गति का संकेत देता है।",
                        "यदि लागू हो, तो आपूर्तिकर्ता गुणवत्ता प्रतिक्रिया के लिए टूटने के प्रतिशत को रिकॉर्ड करें।"
                    ]
                },
                Chalky: {
                    headline: "मिलिंग से पहले चाकी अनाजों को फिर से कंडीशन करें",
                    steps: [
                        "चाकी दिखावट आमतौर पर अपरिपक्व फसल या कटाई के बाद तेजी से सूखने का संकेत देती है।",
                        "अनाज की नमी की जांच करें - टूटने को बढ़ाए बिना चाकीपन को कम करने के लिए 40-45 डिग्री सेल्सियस पर धीरे-धीरे फिर से सुखाएं।",
                        "स्वीकार्य ग्रेड बनाए रखने के लिए चाकी अनाजों को पारभासी अनाजों के साथ ≤20% के अनुपात में मिलाएं।",
                        "फसल क्षेत्र में कटाई के समय की समीक्षा करें - 20-25% नमी पर कटाई स्रोत पर चाकीपन को कम करती है।"
                    ]
                },
                Discolored: {
                    headline: "रंगहीन अनाजों को अलग करें और जांच करें",
                    steps: [
                        "क्रॉस-संदूषण को रोकने के लिए तुरंत बैच से रंगहीन अनाजों को अलग करें।",
                        "फंगल विकास के लिए निरीक्षण करें (गहरे/काले धब्बे एस्परगिलस या फुसैरियम का संकेत दे सकते हैं)।",
                        "यदि रंगहीनता व्यापक है तो एफ्लाटॉक्सिन के लिए नमूने का परीक्षण करें - मंजूरी के बिना प्रेषण न करें।",
                        "रंगहीनता के कारण का पता लगाएं: खेत में अधिक नमी, अनुचित भंडारण, या कीट क्षति।",
                        "सुरक्षा परीक्षणों में विफल रहने वाले रंगहीन अनाजों को स्थानीय नियामक दिशानिर्देशों के अनुसार निपटाया जाना चाहिए।"
                    ]
                }
            },
            advanced: {
                title: "उन्नत मॉडल जानकारी",
                subtitle: "तकनीकी मेट्रिक्स, प्रशिक्षण वक्र और कन्फ्यूजन मैट्रिक्स",
                loading: "मॉडल मेट्रिक्स लोड हो रहे हैं...",
                empty: "कोई प्रशिक्षण मेट्रिक्स नहीं मिला। सुनिश्चित करें कि एमएल पाइपलाइन रिपोर्ट उत्पन्न हुई हैं।",
                metrics: {
                    accuracy: "अनाजों को सही तरीके से ग्रेड किया गया",
                    score: "समग्र एआई स्वास्थ्य स्कोर",
                    trust: "विश्वास स्तर",
                    catch: "पकड़ने की दर"
                },
                category_title: "अनाज श्रेणी के अनुसार प्रदर्शन",
                category_score: "स्कोर: {{score}}%",
                learning_title: "सीखने की प्रगति",
                mistakes_title: "समय के साथ की गई गलतियां",
                confusion_title: "जहां भ्रम पैदा होता है",
                confusion_desc: "ठीक से देखें कि एआई किस अनाज के प्रकारों से भ्रमित हो जाता है (वास्तविक बनाम एआई भविष्यवाणी)"
            }
        }
    },
    mr: {
        ml_analysis_new: {
            header: {
                badge: "एआय अंतर्दृष्टी",
                title: "एआय ने हा निर्णय का घेतला?",
                desc: "एआयचे तर्क - आत्मविश्वासाची पातळी, दृश्य फोकस क्षेत्रे आणि शिफारस केलेल्या क्रिया पाहण्यासाठी धान्याची प्रतिमा अपलोड करा किंवा मागील स्कॅन निवडा.",
                analyze_diff: "दुसर्‍या प्रतिमेचे विश्लेषण करा",
                or_dashboard: "किंवा गुणवत्ता डॅशबोर्ड वरून स्कॅन उघडा"
            },
            upload: {
                title: "विश्लेषणासाठी प्रतिमा अपलोड करा",
                desc: "Grad-CAM स्पष्टीकरण त्वरित तयार करण्यासाठी धान्याची प्रतिमा अपलोड करा",
                drop_title: "प्रतिमा येथे सोडा किंवा ब्राउझ करण्यासाठी क्लिक करा",
                drop_desc: "JPG, PNG, WEBP - कोणतीही धान्याची प्रतिमा",
                analyzing: "एआय सह प्रतिमेचे विश्लेषण करत आहे...",
                analyzing_sub: "धान्य वेगळे करणे, ResNet50 चालवणे, Grad-CAM ची गणना करणे...",
                processing: "प्रक्रिया करत आहे...",
                err_invalid: "कृपया वैध प्रतिमा फाइल निवडा.",
                err_fail: "अपलोड अयशस्वी. बॅकएंड चालू असल्याची खात्री करा."
            },
            summary: {
                title: "एआय सारांश",
                subtitle: "वास्तविक स्कॅन परिणामांवर आधारित",
                pct_100: "सर्व {{count}} शोधलेल्या {{type}} धान्यांचे सामान्य म्हणून वर्गीकरण केले गेले - उत्कृष्ट बॅच गुणवत्ता.",
                pct_80: "एकूण {{count}} {{type}} धान्यांपैकी {{pct}}% सामान्य आहेत. {{defects}} धान्यांमध्ये दोष आढळले. बॅचची गुणवत्ता चांगली आहे परंतु किरकोळ तपासणीची शिफारस केली जाते.",
                pct_50: "एकूण {{count}} {{type}} धान्यांपैकी {{pct}}% सामान्य आहेत. {{defects}} दोषपूर्ण धान्य आढळले - पाठवण्यापूर्वी पुढील तपासणीचा सल्ला दिला जातो.",
                pct_bad: "एकूण {{count}} {{type}} धान्यांपैकी फक्त {{pct}}% सामान्य आहेत. महत्त्वपूर्ण दोष आढळले. मॅन्युअल पडताळणीची जोरदार शिफारस केली जाते."
            },
            confidence: {
                title: "एआय आत्मविश्वास",
                subtitle: "एआय किती आत्मविश्वासी आहे हे पाहण्यासाठी धान्य निवडा",
                select_grain: "धान्य निवडा ({{count}} आढळले)",
                prediction: "भविष्यवाणी",
                score: "आत्मविश्वास",
                low_note: "⚠ या धान्यासाठी एआय चा आत्मविश्वास कमी आहे - कोणतीही कारवाई करण्यापूर्वी अंदाजाची खात्री करण्यासाठी केवळ सूचक म्हणून अंदाज वापरा आणि प्रत्यक्ष तपासणी करा.",
                disclaimer: "आत्मविश्वास अचूकतेची हमी देत नाही. हे एआय मॉडेल किती निश्चित आहे हे दर्शवते - हे निश्चित गुणवत्ता प्रमाणपत्र नाही."
            },
            xai: {
                title: "एआय कोठे पाहत होता",
                subtitle: "धान्य #{{idx}} साठी Grad-CAM दृश्य स्पष्टीकरण",
                generating: "एआय स्पष्टीकरण तयार करत आहे...",
                error: "एआय स्पष्टीकरण तयार करू शकले नाही. नवीन स्कॅन वापरून पहा.",
                not_avail: "उपलब्ध नाही",
                original: { title: "मूळ धान्य", desc: "एआय द्वारे पाहिलेले कच्चे पीक" },
                heatmap: { title: "फोकस हीटमॅप", desc: "लाल = मुख्य निर्णय क्षेत्र; निळा = कमी महत्त्वाचा" },
                overlay: { title: "ओव्हरले", desc: "संयुक्त दृश्य जे दर्शविते की एआय कुठे 'पाहत' होता" },
                prediction_note: "भविष्यवाणी:",
                prediction_confidence: "{{conf}}% आत्मविश्वासासह.",
                prediction_disclaimer: "आत्मविश्वास अचूकतेची हमी देत नाही - नेहमी महत्त्वाच्या निर्णयांसाठी प्रत्यक्ष तपासणी करा."
            },
            remedies: {
                section_title: "शिफारस केलेला उपाय",
                Normal: {
                    headline: "धान्य साठवणूक किंवा पाठवण्यासाठी तयार आहे",
                    steps: [
                        "कोरड्या, हवेशीर गोदामात मानक बॅगिंग आणि साठवणुकीसह पुढे जा.",
                        "गुणवत्ता टिकवून ठेवण्यासाठी साठवणुकीची आर्द्रता 14% पेक्षा कमी ठेवा.",
                        "माहितीसाठी आजच्या स्कॅन आयडीसह बॅचला लेबल करा."
                    ]
                },
                Broken: {
                    headline: "तुटलेल्या धान्यांना वेगळे करा आणि पुन्हा ग्रेड द्या",
                    steps: [
                        "मेकॅनिकल चाळणी दाबकाम (1.6-1.8 मिमी) वापरून मुख्य बॅचमधून तुटलेली धान्ये वेगळी करा.",
                        "दुय्यम उपयोगांसाठी तुटलेल्या धान्याला डाउनग्रेड करा: पीठ दळणे, पशुखाद्य, किंवा स्टार्च निष्कर्षण.",
                        "थ्रेशिंग मशीन सेटिंग्ज तपासा - जास्त तुटणे अनेकदा अयोग्य ड्रम गती दर्शवते.",
                        "लागू असल्यास, पुरवठादार गुणवत्ता प्रतिक्रियासाठी तुटण्याची टक्केवारी रेकॉर्ड करा."
                    ]
                },
                Chalky: {
                    headline: "मिलिंग करण्यापूर्वी चाकी धान्यांना पुन्हा कंडिशन करा",
                    steps: [
                        "चाकी देखावा सामान्यतः अपरिपक्व पीक किंवा कापणीनंतर वेगाने सुकल्याचे सूचित करतो.",
                        "धान्याची आर्द्रता तपासा - तुटणे न वाढवता चाकीपणा कमी करण्यासाठी 40-45 डिग्री सेल्सिअस तापमानावर हळूहळू पुन्हा सुकवा.",
                        "स्वीकार्य ग्रेड राखण्यासाठी चाकी धान्यांना ट्रान्सल्युसंट धान्यांमध्ये ≤20% च्या प्रमाणात मिसळा.",
                        "शेत कापणीच्या वेळेचे पुनरावलोकन करा - 20-25% आर्द्रतेवर कापणी केल्याने स्त्रोतावरील चाकीपणा कमी होतो."
                    ]
                },
                Discolored: {
                    headline: "रंगहीन धान्यांना विलग करा आणि तपासणी करा",
                    steps: [
                        "क्रॉस-दूषित होण्यापासून रोखण्यासाठी तातडीने बॅचमधून रंगहीन धान्यांना वेगळे करा.",
                        "बुरशीच्या वाढीसाठी तपासणी करा (काळे ठिपके एस्परगिलस किंवा फुसारियम दर्शवू शकतात).",
                        "रंगहीनता मोठ्या प्रमाणावर असल्यास ॲफ्लाटॉक्सिनसाठी नमुन्याची चाचणी घ्या - मंजुरीशिवाय पाठवू नका.",
                        "रंगहीनतेचे कारण शोधा: शेतातील जास्त ओलावा, अयोग्य साठवण, किंवा कीटकांचे नुकसान.",
                        "सुरक्षा चाचण्यांमध्ये अपयशी ठरणाऱ्या रंगहीन धान्यांची स्थानिक नियामक मार्गदर्शक तत्त्वांनुसार विल्हेवाट लावावी."
                    ]
                }
            },
            advanced: {
                title: "प्रगत मॉडेल माहिती",
                subtitle: "तांत्रिक मेट्रिक्स, प्रशिक्षण वक्र आणि कन्फ्युजन मॅट्रिक्स",
                loading: "मॉडेल मेट्रिक्स लोड करत आहे...",
                empty: "कोणतेही प्रशिक्षण मेट्रिक्स आढळले नाहीत. एमएल पाइपलाइन अहवाल तयार झाल्याचे सुनिश्चित करा.",
                metrics: {
                    accuracy: "धान्यांचे योग्यरित्या वर्गीकरण केले गेले",
                    score: "एकूण एआय आरोग्य स्कोअर",
                    trust: "विश्वासाची पातळी",
                    catch: "कॅच रेट"
                },
                category_title: "धान्य श्रेणीनुसार कामगिरी",
                category_score: "स्कोअर: {{score}}%",
                learning_title: "शिकण्याची प्रगती",
                mistakes_title: "काळानुरूप केलेल्या चुका",
                confusion_title: "गोंधळ कोठे होतो",
                confusion_desc: "नक्की पहा की एआय कोणत्या धान्याच्या प्रकारांमध्ये गोंधळून जाते (वास्तविक वि. एआय भविष्यवाणी)"
            }
        }
    }
}

for (const lang of ['en', 'hi', 'mr']) {
    const filePath = path.join(localesDir, lang, 'translation.json')
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    data.ml_analysis_new = translations[lang].ml_analysis_new
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

console.log('Translations merged successfully!')
