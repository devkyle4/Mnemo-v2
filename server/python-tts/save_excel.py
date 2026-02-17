import os
import openpyxl

# FILE AND DIRECTORY HANDLING
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
EXCEL_FILE_PATH = os.path.join(DATA_DIR, 'evolution_data.xlsx')

os.makedirs(DATA_DIR, exist_ok=True)

# CREATE EXCEL WORKSHEET
def create_excel_template():
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Evolution Runs"

    # Sheet Headers
    headers = [
        'Timestamp',
        'Generation',
        'Best Fitness',
        'Avg Fitness',
        'Genome Fitness',
        'Ortho Score',
        'Population Size',
        'Mutation Rate',
        'Elite Size',
        'Max Generations',
        'Topic',
        'Best Mnemonic',
        'Target Terms'
    ]

    sheet.append(headers)

    # Style headers
    for cell in sheet[1]:
        cell.font = openpyxl.styles.Font(bold=True, size=11)
        cell.fill = openpyxl.styles.PatternFill(
            start_color="4472C4", 
            end_color="4472C4", 
            fill_type="solid"
        )
        cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
        cell.alignment = openpyxl.styles.Alignment(horizontal="center")

        # Set column widths
    sheet.column_dimensions['A'].width = 20  # Timestamp
    sheet.column_dimensions['B'].width = 12  # Generation
    sheet.column_dimensions['C'].width = 12  # Best Fitness
    sheet.column_dimensions['D'].width = 12  # Avg Fitness
    sheet.column_dimensions['E'].width = 15  # Genome Fitness
    sheet.column_dimensions['F'].width = 12  # Ortho Score
    sheet.column_dimensions['G'].width = 15  # Pop Size
    sheet.column_dimensions['H'].width = 15  # Mutation Rate
    sheet.column_dimensions['I'].width = 12  # Elite Size
    sheet.column_dimensions['J'].width = 15  # Max Gens
    sheet.column_dimensions['K'].width = 20  # Topic
    sheet.column_dimensions['L'].width = 60  # Best Mnemonic
    sheet.column_dimensions['M'].width = 40  # Target Terms

    # Save file
    workbook.save(EXCEL_FILE_PATH)
    print(f'Excel template created at {EXCEL_FILE_PATH}')
