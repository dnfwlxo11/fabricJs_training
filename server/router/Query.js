module.exports = {
    selectArea() {
        const sql = []
        
        sql.push('SELECT ')
        sql.push('* ')
        sql.push('FROM ')
        sql.push('pos')

        return sql.join('')
    },

    insertArea(params) {
        const sql = []
        
        sql.push('INSERT ')
        sql.push('INTO ')
        sql.push('pos(')
        sql.push('id, pos_data) ')
        sql.push('VALUES( ')
        sql.push(`'${params.id}', '${params.pos_data}')`)

        return sql.join('')
    },

    selectPosition(params) {
        const sql = []
        
        sql.push('SELECT ')
        sql.push('* ')
        sql.push('FROM ')
        sql.push('pos ')
        sql.push('WHERE ')
        sql.push('id= ')
        sql.push(`'${params.id}'`)

        return sql.join('')
    },

    updatePosition(params) {
        const sql = []
        
        sql.push('UPDATE ')
        sql.push('pos ')
        sql.push('SET ')
        sql.push('pos_data= ')
        sql.push(`'${JSON.stringify(params.data)}' `)
        sql.push('WHERE ')
        sql.push('id= ')
        sql.push(`'${params.id}'`)

        return sql.join('')
    }
}