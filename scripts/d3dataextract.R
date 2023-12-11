library(tidyverse)
library(dplyr)
library(tidyr)

cab = read.csv("cab.csv")

complicationsToExclude = c("Deep Sternal Infection", "Reintervention for Myocardial Ischemia")
#AGE contingency table
cabage = cab |> filter(category == "Age")
cabage = cabage |> select(Year,complication,Strata,Count)
contingencyAge = cabage |> mutate(Strata = ifelse(Strata %in% c('Under 40', '0 to 40'), 'Under 40', Strata)) |>
  mutate(Strata = ifelse(Strata %in% c('66 to Max', 'Over 65'), 'Over 65', Strata)) |>
  group_by(complication, Strata) |>
  summarise(Count = sum(Count)) |>
  filter(Strata != "Under 40") |>
  filter(!complication %in% complicationsToExclude)

# Specify the desired order of levels for the 'Strata' variable
strata_order <- c('41-65', 'Over 65')

# Convert 'Strata' to a factor with the specified order
contingencyAge$Strata <- factor(contingencyAge$Strata, levels = strata_order)

contingency_table_age <- xtabs(Count ~ complication + Strata, contingencyAge)

#CABG type contingency table
cabtype = cab |> filter(category == "CABG type") |> select(Year,complication,Strata,Count)
contingencyType = cabtype |>
  mutate(Strata = ifelse(Strata == "Other Non-Isolated CABG", "Other", Strata)) |>
  group_by(complication, Strata) |>
  summarise(Count = sum(Count)) |>
  filter(!complication %in% complicationsToExclude)

contingency_table_type <- xtabs(Count ~ complication + Strata, contingencyType)

#Gender contingency table
cabgender = cab |> filter(category == "Gender") |> select(Year,complication,Strata,Count)
contingencyGender = cabgender |>
  group_by(complication, Strata) |>
  summarise(Count = sum(Count)) |>
  filter(!complication %in% complicationsToExclude)
contingency_table_gender <- xtabs(Count ~ complication + Strata, contingencyGender)

#Race
racesToKeep = c("Asian", "White","Hispanic", "Black")

cabrace = cab |> filter(category == "Race") |> select(Year,complication,Strata,Count)
contingencyRace = cabrace |>
  group_by(complication, Strata) |>
  summarise(Count = sum(Count)) |>
  filter(Strata %in% racesToKeep) |>
  filter(!complication %in% complicationsToExclude)
contingency_table_race <- xtabs(Count ~ complication + Strata, contingencyRace)

#PayorType
cabpayor = cab |> filter(category == "PayorType") |> select(Year,complication,Strata,Count)

contingencyPayor = cabpayor |>
  mutate(Strata = ifelse(Strata == "Private Insurance", "Private", Strata)) |>
  group_by(complication, Strata) |>
    filter(Strata != "Uninsured") |>
  summarise(Count = sum(Count)) |>
  filter(!complication %in% complicationsToExclude)


contingency_table_payor <- xtabs(Count ~ complication + Strata, contingencyPayor)


# List of contingency tables
contingency_tables <- list(
  contingency_table_age,
  contingency_table_gender,
  contingency_table_payor,
  contingency_table_race,
  contingency_table_type
)


table_names <- ls(pattern = "^contingency_table_")
# The directory where I want to save the CSV files
output_directory <- "d3data"


# Create the directory if it doesn't exist
dir.create(output_directory, showWarnings = FALSE)

# Loop through the contingency tables and save each one to a CSV file
for (table_name in table_names) {
  if (exists(table_name) && is.table(get(table_name))) {
    contingency_table <- get(table_name)
    contingency_df <- as.data.frame.matrix(contingency_table)
    output_file <- file.path(output_directory, paste0(table_name, ".csv"))
    write.csv(contingency_df, file = output_file, row.names = TRUE)
  } else {
    warning(paste("Object", table_name, "is not a valid contingency table. Skipping..."))
  }
}


